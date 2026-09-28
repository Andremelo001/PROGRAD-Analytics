import json
from pathlib import Path

from loguru import logger

from app.core.domain.value_objects.remote_file_meta import RemoteFileMeta

_MANIFEST_FILENAME = "_manifest.json"


class RawCacheManifest:
    """Registra, por chave (ano/faixa), a URL e os metadados HTTP do último download.

    Usado para decidir se um arquivo em ``app/data/raw/`` precisa ser baixado
    de novo.
    """

    def __init__(self, base_dir: Path) -> None:
        self._path = base_dir / _MANIFEST_FILENAME
        self._entries: dict[str, dict[str, object]] = self._load()

    def _load(self) -> dict[str, dict[str, object]]:
        if not self._path.exists():
            return {}
        try:
            data = json.loads(self._path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            logger.warning("manifesto de cache ilegível, ignorando | {}", self._path)
            return {}
        return data if isinstance(data, dict) else {}

    def is_fresh(self, key: str, url: str, meta: RemoteFileMeta) -> bool:
        """True se ``url``+``meta`` batem com o que está registrado para ``key``."""
        entry = self._entries.get(key)
        if not isinstance(entry, dict) or entry.get("url") != url:
            return False
        etag = entry.get("etag")
        last_modified = entry.get("last_modified")
        content_length = entry.get("content_length")
        cached = RemoteFileMeta(
            etag=etag if isinstance(etag, str) else None,
            last_modified=last_modified if isinstance(last_modified, str) else None,
            content_length=content_length if isinstance(content_length, int) else None,
        )
        return meta.matches(cached)

    def record(self, key: str, url: str, meta: RemoteFileMeta) -> None:
        self._entries[key] = {
            "url": url,
            "etag": meta.etag,
            "last_modified": meta.last_modified,
            "content_length": meta.content_length,
        }

    def save(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(
            json.dumps(self._entries, ensure_ascii=False, indent=2, sort_keys=True)
            + "\n",
            encoding="utf-8",
        )
