import json
from pathlib import Path

from loguru import logger

from app.core.config.settings import settings


class JsonExporter:
    """Grava um objeto (dict/list) em ``app/data/processed/<name>.json``.

    ``indent=None`` grava compacto (sem quebras de linha) — pra arquivos
    grandes que ninguém lê à mão.
    """

    def __init__(self, *, out_dir: Path | None = None, indent: int | None = 2) -> None:
        self._out_dir = out_dir if out_dir is not None else settings.processed_dir
        self._indent = indent

    def export(self, data: object, name: str) -> Path:
        self._out_dir.mkdir(parents=True, exist_ok=True)
        path = self._out_dir / f"{name}.json"
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=self._indent) + "\n",
            encoding="utf-8",
        )
        logger.info("export | {} bytes={}", path.name, path.stat().st_size)
        return path
