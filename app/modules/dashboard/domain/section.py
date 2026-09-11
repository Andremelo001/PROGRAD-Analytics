from dataclasses import dataclass
from typing import Protocol, runtime_checkable

import pandas as pd

from app.modules.dashboard.domain.shared import ScopedData


@dataclass(frozen=True, slots=True)
class DashboardContext:
    """Tudo que uma seção do dashboard pode precisar pra montar sua parte do JSON.

    ``qualidade_nacional``/``trajetoria_nacional`` são os CSVs completos (todas
    as instituições do Brasil), antes do recorte — só ``national_benchmarks``
    usa; as outras seções trabalham só com ``data`` (já filtrado pro escopo).
    """

    data: ScopedData
    qualidade_nacional: pd.DataFrame
    trajetoria_nacional: pd.DataFrame


@runtime_checkable
class DashboardSection(Protocol):
    """Uma seção do ``dashboard.json``: cada uma vira uma chave no payload final.

    ``build_dashboard`` monta o JSON iterando uma lista dessas — acrescentar
    uma seção nova é registrar mais uma aqui, não editar o orquestrador.
    """

    key: str

    def build(self, context: DashboardContext) -> dict[str, object]: ...
