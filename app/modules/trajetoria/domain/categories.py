from typing import Final

# Rótulos das colunas codificadas. O transform
# gera, para cada uma, uma coluna "<col>_desc" com o texto correspondente.
CATEGORY_LABELS: Final[dict[str, dict[int, str]]] = {
    "tp_categoria_administrativa": {
        1: "Pública Federal",
        2: "Pública Estadual",
        3: "Pública Municipal",
        4: "Privada com fins lucrativos",
        5: "Privada sem fins lucrativos",
        7: "Especial",
    },
    "tp_organizacao_academica": {
        1: "Universidade",
        2: "Centro Universitário",
        3: "Faculdade",
        4: "Instituto Federal de Educação, Ciência e Tecnologia",
        5: "Centro Federal de Educação Tecnológica",
    },
    "codigo_regiao": {
        1: "Região Norte",
        2: "Região Nordeste",
        3: "Região Sudeste",
        4: "Região Sul",
        5: "Região Centro-Oeste",
    },
    "tp_grau_academico": {
        1: "Bacharelado",
        2: "Licenciatura",
        3: "Tecnológico",
    },
    "tp_modalidade_ensino": {
        1: "Presencial",
        2: "Curso a distância",
    },
}
