from typing import Final

# Rótulos alternativos vistos nos arquivos mais antigos (abreviações trocadas
# nas siglas das taxas de desistência).
ALIASES: Final[dict[str, list[str]]] = {
    "taxa_desistencia_anual": ["Taxa de Desistência Anual - TDAN"],
    "taxa_desistencia_acumulada": ["Taxa de Desistência Acumulada - TODA"],
}
