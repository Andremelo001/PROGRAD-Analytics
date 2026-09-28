import re
import shutil
import zipfile
from collections.abc import Iterator, Sequence
from pathlib import Path

from loguru import logger

from app.core.config.settings import settings
from app.core.domain.value_objects.raw_file import RawFile
from app.core.infrastructure.http.cached_download import resolve_downloads
from app.core.infrastructure.http.inep_client import InepClient
from app.core.infrastructure.scraping.govbr_tabs import parse_file_links, parse_tabs
from app.core.infrastructure.storage.raw_cache import RawCacheManifest

_YEAR_RE = re.compile(r"(?:19|20)\d{2}")
_XLSX_IN_ZIP_RE = re.compile(
    r"indicadores_(?:trajetoria|fluxo).*\.xlsx$", re.IGNORECASE
)


def _slug(label: str) -> str:
    return re.sub(r"\s*-\s*", "-", label.strip())


def _start_year(label: str) -> int | None:
    match = _YEAR_RE.search(label)
    return int(match.group()) if match else None


class InepTrajetoriaSource:
    """Descobre e baixa os ``.zip`` do portal de Indicadores de Trajetória.

    landing -> abas (faixa de anos) -> subpágina -> ``.zip`` -> extrai o ``.xlsx``.
    ``years`` filtra pelo ano inicial da faixa (ex.: ``2020`` -> aba ``2020-2024``).
    Sem ``years``, usa ``min_year``/``max_year`` (default: sem restrição, todas
    as faixas da página). URL da landing vem de
    ``settings.trajetoria_landing_url`` (``.env``).
    """

    def __init__(
        self,
        *,
        client: InepClient | None = None,
        raw_dir: Path | None = None,
        landing_url: str | None = None,
        min_year: int | None = None,
        max_year: int | None = None,
    ) -> None:
        self._client = client or InepClient()
        self._raw_dir = raw_dir or (settings.raw_dir / "trajetoria")
        self._landing = landing_url or settings.trajetoria_landing_url
        self._min_year = (
            min_year if min_year is not None else settings.trajetoria_min_year
        )
        self._max_year = (
            max_year if max_year is not None else settings.trajetoria_max_year
        )

    def collect(
        self,
        *,
        years: Sequence[int] | None = None,
        force: bool = False,
    ) -> Iterator[RawFile]:
        wanted = {int(year) for year in years} if years is not None else None
        landing_html = self._client.get_text(self._landing)

        plan: list[tuple[str, str]] = []
        for tab in parse_tabs(landing_html, self._landing):
            label = _slug(tab.label)
            start = _start_year(label)
            if not self._in_scope(start, wanted):
                continue
            zip_url = _pick_zip(
                parse_file_links(self._client.get_text(tab.url), tab.url)
            )
            if zip_url is None:
                logger.warning("trajetoria | sem .zip na aba {}", tab.label)
                continue
            plan.append((label, zip_url))

        manifest = RawCacheManifest(self._raw_dir)
        resolved = resolve_downloads(
            self._client,
            manifest,
            plan,
            lambda label, url: self._raw_dir / label / url.rsplit("/", 1)[-1],
            force=force,
        )

        for (label, zip_url), (zip_path, changed) in zip(plan, resolved, strict=True):
            xlsx_path = _extract_xlsx(zip_path, zip_path.parent, force=changed)
            if xlsx_path is None:
                logger.warning(
                    "trajetoria | .zip sem .xlsx esperado | {}", zip_path.name
                )
                continue
            yield RawFile(
                module="trajetoria",
                year_label=label,
                source_url=zip_url,
                path=xlsx_path,
                changed=changed,
            )

    def _in_scope(self, start: int | None, wanted: set[int] | None) -> bool:
        if wanted is not None:
            return start is not None and start in wanted
        if start is None:
            return False
        if self._min_year is not None and start < self._min_year:
            return False
        return not (self._max_year is not None and start > self._max_year)


def _pick_zip(links: Sequence[str]) -> str | None:
    candidates = [url for url in links if url.lower().endswith(".zip")]
    return candidates[0] if candidates else None


def _extract_xlsx(zip_path: Path, dest_dir: Path, *, force: bool) -> Path | None:
    with zipfile.ZipFile(zip_path) as archive:
        members = [
            name
            for name in archive.namelist()
            if _XLSX_IN_ZIP_RE.search(Path(name).name)
        ]
        if not members:
            return None
        members.sort(key=lambda name: (0 if "trajetoria" in name.lower() else 1, name))
        member = members[0]
        target = dest_dir / Path(member).name
        if target.exists() and not force:
            return target
        dest_dir.mkdir(parents=True, exist_ok=True)
        with archive.open(member) as src, target.open("wb") as dst:
            shutil.copyfileobj(src, dst)
    logger.info("trajetoria | extraído {} de {}", target.name, zip_path.name)
    return target
