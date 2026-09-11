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
    ) -> None:
        self._module = module
        self._source = source
        self._reader = reader
        self._transformer = transformer
        self._exporter = exporter

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
        report = ModuleReport(module=self._module)

        if not raw_files:
            logger.warning("pipeline sem dados | module={}", self._module)
            report.log_summary()
            return report

        existing_output = self._exporter.exists(self._module)
        if existing_output is not None and not any(raw.changed for raw in raw_files):
            report.output_path = existing_output
            report.reused = True
            report.log_summary()
            return report

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
