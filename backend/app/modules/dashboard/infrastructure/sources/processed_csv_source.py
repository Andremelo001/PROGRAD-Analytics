import pandas as pd

from app.core.config.settings import settings
from app.core.infrastructure.storage.dataset_locator import find_dataset
from app.core.infrastructure.storage.meta_writer import read_meta


class ProcessedCsvSource:
    """Implementa ``DashboardSource`` lendo os CSVs já processados.

    Lê qualidade.csv/trajetoria.csv[.gz] de ``app/data/processed/``.
    """

    def read_qualidade(self) -> pd.DataFrame:
        return pd.read_csv(find_dataset(settings.processed_dir, "qualidade"))

    def read_trajetoria(self) -> pd.DataFrame:
        return pd.read_csv(find_dataset(settings.processed_dir, "trajetoria"))

    def read_meta(self) -> dict[str, object]:
        return read_meta()
