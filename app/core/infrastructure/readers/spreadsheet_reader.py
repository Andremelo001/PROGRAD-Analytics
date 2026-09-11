import re
from collections.abc import Mapping, Sequence

import pandas as pd
from loguru import logger

from app.core.domain.normalization import normalize_key
from app.core.domain.value_objects.raw_file import RawFile

_DEFAULT_SKIP_SHEETS: tuple[str, ...] = (
    "atualizações",
    "atualizacoes",
    "dicionário",
    "dicionario",
    "sobre",
    "notas",
    "leia-me",
    "leiame",
)


class SpreadsheetReader:
    """Lê ``.xlsx``/``.xls``: escolhe a planilha e detecta a linha de cabeçalho.

    - Seleção da sheet: primeiro nome que casa ``sheet_patterns`` (regex);
      senão, primeira sheet fora de ``skip_sheet_names``.
    - Linha do cabeçalho: ``header_overrides`` (por nome de arquivo) > ``header_row``
      fixo > heurística (linha cujas células mais casam ``expected_labels``).
    - ``header_block_rows``: altura do bloco de cabeçalho. Se > 1, os nomes vêm
      da linha ``header_row`` completados pela seguinte, e as linhas restantes do
      bloco (ex.: linha de códigos técnicos) são descartadas dos dados.
    """

    def __init__(
        self,
        *,
        sheet_patterns: Sequence[str] = (),
        skip_sheet_names: Sequence[str] = _DEFAULT_SKIP_SHEETS,
        expected_labels: Sequence[str] = (),
        header_row: int | None = None,
        header_block_rows: int = 1,
        header_overrides: Mapping[str, int] | None = None,
        max_header_scan: int = 20,
    ) -> None:
        self._sheet_res = [
            re.compile(pattern, re.IGNORECASE) for pattern in sheet_patterns
        ]
        self._skip = {name.casefold() for name in skip_sheet_names}
        self._expected = {normalize_key(label) for label in expected_labels}
        self._header_row = header_row
        self._header_block_rows = max(1, header_block_rows)
        self._overrides = {
            key.casefold(): row for key, row in (header_overrides or {}).items()
        }
        self._max_scan = max_header_scan

    def read(self, raw: RawFile) -> pd.DataFrame:
        # calamine (Rust) lê .xlsx/.xls/.xlsb com o mesmo comportamento e é
        # 3-6x mais rápido que openpyxl/xlrd nos arquivos grandes do INEP.
        excel = pd.ExcelFile(raw.path, engine="calamine")
        sheet = self._pick_sheet([str(name) for name in excel.sheet_names])
        header_row = self._resolve_header_row(raw, excel, sheet)

        frame = pd.read_excel(excel, sheet_name=sheet, header=header_row, dtype=object)
        if self._header_block_rows > 1:
            frame = self._merge_fill_header(excel, sheet, header_row + 1, frame)
            frame = frame.iloc[self._header_block_rows - 1 :].reset_index(drop=True)
        frame.columns = pd.Index([str(col).strip() for col in frame.columns])

        logger.info(
            "read | {} sheet={!r} header_row={} block={} rows={} cols={}",
            raw.path.name,
            sheet,
            header_row,
            self._header_block_rows,
            len(frame),
            frame.shape[1],
        )
        return frame

    def _pick_sheet(self, sheet_names: Sequence[str]) -> str:
        for pattern in self._sheet_res:
            for name in sheet_names:
                if pattern.search(name):
                    return name
        for name in sheet_names:
            if name.casefold() not in self._skip:
                return name
        return sheet_names[0]

    def _resolve_header_row(self, raw: RawFile, excel: pd.ExcelFile, sheet: str) -> int:
        override = self._overrides.get(raw.path.name.casefold())
        if override is not None:
            return override
        if self._header_row is not None:
            return self._header_row
        return self._detect_header_row(excel, sheet)

    def _detect_header_row(self, excel: pd.ExcelFile, sheet: str) -> int:
        probe = pd.read_excel(
            excel, sheet_name=sheet, header=None, nrows=self._max_scan, dtype=object
        )
        best_row = 0
        best_score = -1
        for i in range(len(probe)):
            cells = {
                normalize_key(value)
                for value in probe.iloc[i].tolist()
                if value is not None and str(value).strip()
            }
            score = len(cells & self._expected) if self._expected else len(cells)
            if score > best_score:
                best_row, best_score = i, score
        logger.info(
            "header_row detectado | sheet={!r} row={} score={}",
            sheet,
            best_row,
            best_score,
        )
        return best_row

    def _merge_fill_header(
        self,
        excel: pd.ExcelFile,
        sheet: str,
        fill_row: int,
        frame: pd.DataFrame,
    ) -> pd.DataFrame:
        fill = (
            pd.read_excel(
                excel,
                sheet_name=sheet,
                header=None,
                skiprows=fill_row,
                nrows=1,
                dtype=object,
            )
            .iloc[0]
            .tolist()
        )
        columns = list(frame.columns)
        for idx, col in enumerate(columns):
            if idx >= len(fill):
                break
            current = str(col).strip()
            alt = "" if fill[idx] is None else str(fill[idx]).strip()
            if not alt:
                continue
            looks_blank = current == "" or current.lower().startswith("unnamed")
            primary_matches = normalize_key(current) in self._expected
            alt_matches = normalize_key(alt) in self._expected
            if looks_blank or (not primary_matches and alt_matches):
                columns[idx] = alt
        frame.columns = pd.Index(columns)
        return frame
