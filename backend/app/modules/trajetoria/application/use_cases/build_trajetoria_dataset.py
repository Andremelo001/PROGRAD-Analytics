from collections.abc import Sequence

from app.core.config.column_mapping import load_column_mapping
from app.core.config.settings import settings
from app.core.domain.pipelines.pipeline import DataPipeline
from app.core.domain.pipelines.report import ModuleReport
from app.core.domain.pipelines.schema import model_to_specs, validate_category_columns
from app.core.infrastructure.readers.spreadsheet_reader import SpreadsheetReader
from app.core.infrastructure.storage.file_exporter import CsvExporter
from app.core.infrastructure.storage.meta_writer import (
    DatasetMeta,
    MetaWriter,
    read_previous_fingerprint,
)
from app.modules.trajetoria.application.ports.trajetoria_source import TrajetoriaSource
from app.modules.trajetoria.domain.schema import TrajetoriaRow
from app.modules.trajetoria.domain.services.transform import TrajetoriaTransformer
from app.modules.trajetoria.infrastructure.sources.inep_trajetoria_source import (
    InepTrajetoriaSource,
)

_MODULE = "trajetoria"
_SHEET_PATTERNS = ("trajetoria", "fluxo", "indicadores")
_HEADER_BLOCK_ROWS = 3


def build_trajetoria_dataset(
    *,
    source: TrajetoriaSource | None = None,
    years: Sequence[int] | None = None,
    force: bool = False,
) -> ModuleReport:
    """Executa o pipeline do módulo Trajetória e grava ``trajetoria.csv`` + meta."""
    mapping = load_column_mapping(_MODULE)
    context = f"{settings.colunas_inep_file.name} [{_MODULE}]"
    specs = model_to_specs(TrajetoriaRow, mapping.colunas, context=context)
    validate_category_columns(specs, mapping.categorias, context=context)
    pipeline = DataPipeline(
        module=_MODULE,
        source=source if source is not None else InepTrajetoriaSource(),
        reader=SpreadsheetReader(
            sheet_patterns=_SHEET_PATTERNS,
            expected_labels=[spec.original for spec in specs],
            header_block_rows=_HEADER_BLOCK_ROWS,
        ),
        transformer=TrajetoriaTransformer(specs, mapping.categorias),
        exporter=CsvExporter(),
        config_fingerprint=mapping.fingerprint(),
        previous_config_fingerprint=read_previous_fingerprint(_MODULE),
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
            mapping_fingerprint=report.config_fingerprint,
        )
    )
