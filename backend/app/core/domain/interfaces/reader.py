from typing import Protocol

import pandas as pd

from app.core.domain.value_objects.raw_file import RawFile


class Reader(Protocol):
    """Lê a planilha bruta (sheet + linha de cabeçalho corretas) num DataFrame."""

    def read(self, raw: RawFile) -> pd.DataFrame: ...
