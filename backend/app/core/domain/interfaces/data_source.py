from collections.abc import Iterable, Sequence
from typing import Protocol

from app.core.domain.value_objects.raw_file import RawFile


class DataSource(Protocol):
    """Descobre (scraping) e baixa os arquivos brutos de um módulo."""

    def collect(
        self,
        *,
        years: Sequence[int] | None = None,
        force: bool = False,
    ) -> Iterable[RawFile]: ...
