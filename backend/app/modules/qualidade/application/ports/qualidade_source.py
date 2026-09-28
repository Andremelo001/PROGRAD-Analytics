from typing import Protocol, runtime_checkable

from app.core.domain.interfaces.data_source import DataSource


@runtime_checkable
class QualidadeSource(DataSource, Protocol):
    """Fonte de dados do módulo Qualidade (arquivos CPC do INEP)."""
