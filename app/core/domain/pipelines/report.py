from dataclasses import dataclass, field
from pathlib import Path

from loguru import logger

from app.core.domain.value_objects.raw_file import RawFile


@dataclass
class FileReport:
    """Contadores de um arquivo bruto ao longo do transform."""

    raw_file: RawFile
    rows_in: int = 0
    rows_out: int = 0
    rows_dropped_bad_type: int = 0
    rows_dropped_missing_key: int = 0
    columns_matched: list[str] = field(default_factory=list)
    columns_unmatched_in_file: list[str] = field(default_factory=list)
    columns_missing_from_file: list[str] = field(default_factory=list)

    def needs_review(self) -> bool:
        """True se um arquivo novo/baixado agora tem coluna canônica faltando.

        Restrito a ``raw_file.changed`` de propósito: um arquivo antigo e já
        revisado (ex.: CPC 2015-2017, que estruturalmente não tem
        ``nota_padronizada_fg``) não deve gerar alerta toda vez que o
        pipeline roda de novo — só quando o arquivo em si mudou é que vale a
        pena olhar de novo.
        """
        if not self.raw_file.changed:
            return False
        return bool(self.columns_missing_from_file or self.columns_unmatched_in_file)


@dataclass(frozen=True, slots=True)
class ReviewItem:
    """Um arquivo cujo layout de colunas merece revisão humana."""

    file: str
    year_label: str
    columns_missing_from_file: list[str]
    columns_unmatched_in_file: list[str]


@dataclass
class ModuleReport:
    """Resultado consolidado do pipeline de um módulo.

    ``reused=True`` quando nada mudou na fonte e o CSV anterior foi mantido
    como está (sem reler/reprocessar nenhum arquivo).
    """

    module: str
    file_reports: list[FileReport] = field(default_factory=list)
    rows_final: int = 0
    duplicates_removed: int = 0
    columns: list[str] = field(default_factory=list)
    output_path: Path | None = None
    reused: bool = False

    def review_items(self) -> list[ReviewItem]:
        return [
            ReviewItem(
                file=fr.raw_file.path.name,
                year_label=fr.raw_file.year_label,
                columns_missing_from_file=fr.columns_missing_from_file,
                columns_unmatched_in_file=fr.columns_unmatched_in_file,
            )
            for fr in self.file_reports
            if fr.needs_review()
        ]

    def log_summary(self) -> None:
        if self.reused:
            logger.info(
                "module {} | sem mudanças na fonte, mantém {}",
                self.module,
                self.output_path,
            )
            return
        logger.info(
            "module {} | files={} rows_final={} dups_removed={} output={}",
            self.module,
            len(self.file_reports),
            self.rows_final,
            self.duplicates_removed,
            self.output_path,
        )
        for fr in self.file_reports:
            logger.info(
                "  file={} rows_in={} rows_out={} bad_type={} missing_key={} "
                "cols_matched={} cols_unmatched_in_file={} cols_missing_from_file={}",
                fr.raw_file.path.name,
                fr.rows_in,
                fr.rows_out,
                fr.rows_dropped_bad_type,
                fr.rows_dropped_missing_key,
                len(fr.columns_matched),
                len(fr.columns_unmatched_in_file),
                len(fr.columns_missing_from_file),
            )

        for item in self.review_items():
            logger.warning(
                "REVISAR | module={} file={} faltando={} novas_sem_par={}"
                " — layout pode ter mudado; ver column_aliases.py",
                self.module,
                item.file,
                item.columns_missing_from_file,
                item.columns_unmatched_in_file,
            )
