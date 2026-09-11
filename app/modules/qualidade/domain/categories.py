from typing import Final

# CPC já traz Organização Acadêmica / Categoria Administrativa / Modalidade como
# texto ("Universidade", "Pública Federal", ...).
CATEGORY_LABELS: Final[dict[str, dict[int, str]]] = {}
