from collections.abc import Sequence

from app.core.domain.pipelines.pipeline import DataPipeline
from app.core.domain.pipelines.report import ModuleReport
from app.core.domain.pipelines.schema import model_to_specs
from app.core.infrastructure.readers.spreadsheet_reader import SpreadsheetReader
from app.core.infrastructure.storage.file_exporter import CsvExporter
from app.core.infrastructure.storage.meta_writer import DatasetMeta, MetaWriter
from app.modules.qualidade.application.ports.qualidade_source import QualidadeSource
from app.modules.qualidade.domain.schema import CpcRow
from app.modules.qualidade.domain.services.transform import CpcTransformer
from app.modules.qualidade.infrastructure.sources.inep_qualidade_source import (
    InepQualidadeSource,
)

_MODULE = "qualidade"
_SHEET_PATTERNS = ("cpc", "conceito", "resultado", "plan")


def build_qualidade_dataset(
    *,
    source: QualidadeSource | None = None,
    years: Sequence[int] | None = None,
    force: bool = False,
) -> ModuleReport:
    """Executa o pipeline do módulo Qualidade e grava ``qualidade.csv`` + meta."""
    specs = model_to_specs(CpcRow)
    pipeline = DataPipeline(
        module=_MODULE,
        source=source if source is not None else InepQualidadeSource(),
        reader=SpreadsheetReader(
            sheet_patterns=_SHEET_PATTERNS,
            expected_labels=[spec.original for spec in specs],
        ),
        transformer=CpcTransformer(),
        exporter=CsvExporter(),
    )
    report = pipeline.run(years=years, force=force)
    _write_meta(report)
    return report


def _write_meta(report: ModuleReport) -> None:
    if report.output_path is None or report.reused:
        return
    source_urls = sorted(
        {fr.raw_file.source_url for fr in report.file_reports if fr.raw_file.source_url}
    )
    review_items = report.review_items()
    MetaWriter().upsert(
        DatasetMeta(
            name=_MODULE,
            file=report.output_path.name,
            rows=report.rows_final,
            columns=report.columns,
            source_urls=source_urls,
            review_needed=bool(review_items),
            review_items=review_items,
        )
    )
