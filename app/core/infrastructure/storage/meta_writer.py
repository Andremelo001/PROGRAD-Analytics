import json
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path

from loguru import logger

from app.core.config.settings import settings
from app.core.domain.pipelines.report import ReviewItem

_META_FILENAME = "_meta.json"


@dataclass
class DatasetMeta:
    """Metadados de um dataset gerado.

    ``review_items``: arquivos baixados nesta execução com coluna faltando ou
    coluna nova sem par — provável mudança de layout no INEP; ver
    ``column_aliases.py`` do módulo.
    """

    name: str
    file: str
    rows: int
    columns: list[str] = field(default_factory=list)
    source_urls: list[str] = field(default_factory=list)
    generated_at: str = ""
    review_needed: bool = False
    review_items: list[ReviewItem] = field(default_factory=list)


class MetaWriter:
    """Mantém ``app/data/processed/_meta.json`` com metadados por dataset."""

    def __init__(self, *, out_dir: Path | None = None) -> None:
        base = out_dir if out_dir is not None else settings.processed_dir
        self._path = base / _META_FILENAME

    def upsert(self, meta: DatasetMeta) -> Path:
        if not meta.generated_at:
            meta.generated_at = datetime.now(UTC).isoformat(timespec="seconds")

        data: dict[str, object] = {}
        if self._path.exists():
            loaded = json.loads(self._path.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                data = loaded

        data[meta.name] = asdict(meta)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        logger.info("meta | {} atualizado em {}", meta.name, self._path.name)
        return self._path
