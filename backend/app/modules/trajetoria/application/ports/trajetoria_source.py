from typing import Protocol, runtime_checkable

from app.core.domain.interfaces.data_source import DataSource


@runtime_checkable
class TrajetoriaSource(DataSource, Protocol):
    """Fonte de dados do módulo Trajetória (arquivos .zip do INEP)."""
