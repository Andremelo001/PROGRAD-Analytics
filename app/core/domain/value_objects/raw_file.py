from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class RawFile:
    """Um arquivo bruto (planilha) já baixado localmente, pronto para leitura.

    ``changed=False`` quando o cache local já estava atualizado (a fonte foi
    checada via HEAD, mas nada precisou ser baixado de novo).
    """

    module: str
    year_label: str
    source_url: str
    path: Path
    changed: bool = True
