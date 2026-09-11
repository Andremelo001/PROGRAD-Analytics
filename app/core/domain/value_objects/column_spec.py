from dataclasses import dataclass
from typing import Literal

DType = Literal["int", "float", "string"]


@dataclass(frozen=True, slots=True)
class ColumnSpec:
    """Mapeamento de uma coluna: nomes originais aceitos -> normalizado + tipo alvo.

    Derivado do modelo pydantic de cada módulo (+ aliases extras); consumido
    pelo transform. ``aliases[0]``; os demais
    cobrem variações de rótulo entre anos/arquivos.
    """

    normalized: str
    dtype: DType
    aliases: tuple[str, ...]
    description: str | None = None

    @property
    def original(self) -> str:
        return self.aliases[0]
