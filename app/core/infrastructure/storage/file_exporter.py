from pathlib import Path

import pandas as pd
from loguru import logger

from app.core.config.settings import settings


class CsvExporter:
    """Grava o DataFrame em ``app/data/processed/<name>.csv`` (ou ``.csv.gz``).

    ``compress``: ``True`` força gzip, ``False`` força texto puro, ``None``
    (padrão) decide pelo tamanho do ``.csv`` frente a ``gzip_threshold_bytes``
    (default: ``settings.csv_gzip_threshold_bytes``).
    """

    def __init__(
        self,
        *,
        out_dir: Path | None = None,
        gzip_threshold_bytes: int | None = None,
        compress: bool | None = None,
    ) -> None:
        self._out_dir = out_dir if out_dir is not None else settings.processed_dir
        self._threshold = (
            gzip_threshold_bytes
            if gzip_threshold_bytes is not None
            else settings.csv_gzip_threshold_bytes
        )
        self._compress = compress

    def exists(self, name: str) -> Path | None:
        gz_path = self._out_dir / f"{name}.csv.gz"
        if gz_path.exists():
            return gz_path
        csv_path = self._out_dir / f"{name}.csv"
        return csv_path if csv_path.exists() else None

    def export(self, frame: pd.DataFrame, name: str) -> Path:
        self._out_dir.mkdir(parents=True, exist_ok=True)
        csv_path = self._out_dir / f"{name}.csv"
        gz_path = self._out_dir / f"{name}.csv.gz"

        if self._compress is True:
            frame.to_csv(gz_path, index=False, compression="gzip")
            csv_path.unlink(missing_ok=True)
            return self._logged(gz_path, frame)

        frame.to_csv(csv_path, index=False)
        too_big = csv_path.stat().st_size > self._threshold
        if self._compress is None and too_big:
            frame.to_csv(gz_path, index=False, compression="gzip")
            csv_path.unlink(missing_ok=True)
            return self._logged(gz_path, frame)

        gz_path.unlink(missing_ok=True)
        return self._logged(csv_path, frame)

    @staticmethod
    def _logged(path: Path, frame: pd.DataFrame) -> Path:
        logger.info(
            "export | {} rows={} cols={} bytes={}",
            path.name,
            len(frame),
            frame.shape[1],
            path.stat().st_size,
        )
        return path
