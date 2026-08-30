from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_APP_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    env: str = "local"
    log_level: str = "INFO"

    data_dir: Path = _APP_DIR / "data"

    http_timeout: float = 30.0
    http_user_agent: str = "PROGRAD-Analytics/0.1 (data pipeline)"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def raw_dir(self) -> Path:
        return self.data_dir / "raw"

    @property
    def processed_dir(self) -> Path:
        return self.data_dir / "processed"


settings = Settings()
