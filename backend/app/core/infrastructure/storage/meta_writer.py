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
    coluna nova sem par — provável mudança de layout no INEP; ajuste
    ``colunas_inep.json`` (raiz do repo). ``mapping_fingerprint``: hash da
    seção de ``colunas_inep.json`` usada nesta geração (ver
    ``ModuleColumnMapping.fingerprint``).
    """

    name: str
    file: str
    rows: int
    columns: list[str] = field(default_factory=list)
    source_urls: list[str] = field(default_factory=list)
    generated_at: str = ""
    review_needed: bool = False
    review_items: list[ReviewItem] = field(default_factory=list)
    mapping_fingerprint: str | None = None


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


def read_meta(*, out_dir: Path | None = None) -> dict[str, object]:
    """Lê ``_meta.json`` inteiro (todos os módulos já processados).

    Retorna ``{}`` se o arquivo ainda não existir ou estiver corrompido —
    metadado é informativo, não deve derrubar quem só quer consultá-lo.
    """
    base = out_dir if out_dir is not None else settings.processed_dir
    path = base / _META_FILENAME
    try:
        loaded = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return loaded if isinstance(loaded, dict) else {}


def read_previous_fingerprint(
    module: str, *, out_dir: Path | None = None
) -> str | None:
    """``mapping_fingerprint`` da última geração do módulo, se houver."""
    entry = read_meta(out_dir=out_dir).get(module)
    if not isinstance(entry, dict):
        return None
    value = entry.get("mapping_fingerprint")
    return value if isinstance(value, str) else None
