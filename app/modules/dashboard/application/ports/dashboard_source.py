from typing import Protocol, runtime_checkable

import pandas as pd


@runtime_checkable
class DashboardSource(Protocol):
    """Fonte dos dois datasets nacionais já processados que o dashboard lê."""

    def read_qualidade(self) -> pd.DataFrame: ...

    def read_trajetoria(self) -> pd.DataFrame: ...
