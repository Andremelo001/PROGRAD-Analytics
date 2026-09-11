from typing import Final

# Rótulos alternativos vistos nos CPCs 2015-2017 (layout anterior ao de 2018+,
# que é a fonte de verdade em schema.py). Anos < 2015 têm grão diferente
# (IES x Área, sem Código do Curso) e são excluídos pelo InepQualidadeSource.
ALIASES: Final[dict[str, list[str]]] = {
    "ano": ["Edição"],
    "area_avaliacao": ["Área de Enquadramento"],
    "n_concluintes_inscritos": ["Concluintes Inscritos"],
    "n_concluintes_participantes": ["Concluintes Participantes"],
    "conceito_enade_continuo": ["Nota Contínua do Enade"],
    "n_concluintes_com_nota_enem": [
        "Concluintes Participantes com nota no Enem",
        "Nº de Concluintes Participantes com nota no Enem",
    ],
    "proporcao_concluintes_com_nota_enem": [
        "Percentual de Concluintes participantes com nota no Enem",
    ],
    "nota_bruta_oportunidade_ampliacao": [
        "Nota Bruta - Oportunidades de Ampliação da Formação",
    ],
    "nota_padronizada_oportunidade_ampliacao": [
        "Nota Padronizada - Oportunidades de Ampliação da Formação",
    ],
    "cpc_continuo": ["CPC Contínuo"],
    "cpc_faixa": ["CPC Faixa"],
}
