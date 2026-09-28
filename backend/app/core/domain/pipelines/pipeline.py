from collections.abc import Sequence

import pandas as pd
from loguru import logger

from app.core.domain.interfaces.data_source import DataSource
from app.core.domain.interfaces.exporter import Exporter
from app.core.domain.interfaces.reader import Reader
from app.core.domain.interfaces.transformer import Transformer
from app.core.domain.pipelines.report import ModuleReport


class DataPipeline:
    """Orquestra os 4 estágios de um módulo: Extract -> Read -> Transform -> Load.

    Cada estágio é um Protocol (DataSource / Reader / Transformer / Exporter).
    Erros de linha e de coluna viram contadores no ``ModuleReport`` final,
    não exceptions.
    """

    def __init__(
        self,
        *,
        module: str,
        source: DataSource,
        reader: Reader,
        transformer: Transformer,
        exporter: Exporter,
        config_fingerprint: str | None = None,
        previous_config_fingerprint: str | None = None,
    ) -> None:
        """Monta o pipeline de um módulo.

        ``config_fingerprint``: hash da configuração de colunas usada agora;
        ``previous_config_fingerprint``: o usado na última geração (do
        ``_meta.json``). Se diferirem, o CSV anterior não serve mais — foi
        gerado com outros nomes de coluna — e o módulo é reprocessado a partir
        dos arquivos em cache, mesmo sem nada novo na fonte.
        """
        self._module = module
        self._source = source
        self._reader = reader
        self._transformer = transformer
        self._exporter = exporter
        self._config_fingerprint = config_fingerprint
        self._config_changed = (
            config_fingerprint is not None
            and config_fingerprint != previous_config_fingerprint
        )

    def run(
        self,
        *,
        years: Sequence[int] | None = None,
        force: bool = False,
    ) -> ModuleReport:
        logger.info(
            "pipeline start | module={} years={} force={}", self._module, years, force
        )
        raw_files = list(self._source.collect(years=years, force=force))
        report = ModuleReport(
            module=self._module, config_fingerprint=self._config_fingerprint
        )

        if not raw_files:
            logger.warning("pipeline sem dados | module={}", self._module)
            report.log_summary()
            return report

        existing_output = self._exporter.exists(self._module)
        source_changed = any(raw.changed for raw in raw_files)
        if existing_output is not None and not source_changed:
            if not self._config_changed:
                report.output_path = existing_output
                report.reused = True
                report.log_summary()
                return report
            logger.info(
                "module {} | colunas_inep.json mudou desde a última geração — "
                "reprocessando a partir dos arquivos em cache",
                self._module,
            )
        report.config_changed = self._config_changed

        frames: list[pd.DataFrame] = []
        for raw in raw_files:
            logger.info("read+transform | {}", raw.path.name)
            raw_frame = self._reader.read(raw)
            result = self._transformer.transform(raw_frame, raw)
            report.file_reports.append(result.report)
            if not result.frame.empty:
                frames.append(result.frame)

        if not frames:
            logger.warning("pipeline sem dados | module={}", self._module)
            report.log_summary()
            return report

        combined = pd.concat(frames, ignore_index=True)
        rows_before = len(combined)
        combined = combined.drop_duplicates(ignore_index=True)
        report.duplicates_removed = rows_before - len(combined)
        report.rows_final = len(combined)
        report.columns = [str(col) for col in combined.columns]
        report.output_path = self._exporter.export(combined, self._module)

        report.log_summary()
        logger.info(
            "pipeline done | module={} rows_final={} -> {}",
            self._module,
            report.rows_final,
            report.output_path,
        )
        return report
