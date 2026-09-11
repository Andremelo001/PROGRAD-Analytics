from pathlib import Path
from typing import Protocol

import pandas as pd


class Exporter(Protocol):
    """Grava o DataFrame final de um módulo em app/data/processed/."""

    def export(self, frame: pd.DataFrame, name: str) -> Path: ...

    def exists(self, name: str) -> Path | None:
        """Caminho do arquivo já exportado para ``name``, se houver."""
        ...
