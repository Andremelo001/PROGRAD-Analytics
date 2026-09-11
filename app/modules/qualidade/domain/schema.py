from pydantic import BaseModel, Field


class CpcRow(BaseModel):
    """Schema do dataset CPC (Indicadores de Qualidade da Educação Superior).

    Fonte da verdade das colunas: nome do campo = normalizado, ``alias`` = nome
    original do arquivo. Nunca é
    instanciado; serve só para introspecção via ``model_to_specs``.
    """

    ano: int = Field(alias="Ano")
    codigo_ies: int = Field(alias="Código da IES")
    nome_ies: str = Field(alias="Nome da IES")
    sigla_ies: str = Field(alias="Sigla da IES")
    organizacao_academica: str = Field(alias="Organização Acadêmica")
    categoria_administrativa: str = Field(alias="Categoria Administrativa")
    codigo_curso: int = Field(alias="Código do Curso")
    codigo_area: int = Field(alias="Código da Área")
    area_avaliacao: str = Field(alias="Área de Avaliação")
    modalidade_ensino: str = Field(alias="Modalidade de Ensino")
    codigo_municipio: int = Field(alias="Código do Município")
    municipio_curso: str = Field(alias="Município do Curso")
    sigla_uf: str = Field(alias="Sigla da UF")
    n_concluintes_inscritos: int = Field(alias="Nº de Concluintes Inscritos")
    n_concluintes_participantes: int = Field(alias="Nº de Concluintes Participantes")
    nota_bruta_fg: float = Field(alias="Nota Bruta - FG")
    nota_padronizada_fg: float = Field(alias="Nota Padronizada - FG")
    nota_bruta_ce: float = Field(alias="Nota Bruta - CE")
    nota_padronizada_ce: float = Field(alias="Nota Padronizada - CE")
    conceito_enade_continuo: float = Field(alias="Conceito Enade (Contínuo)")
    n_concluintes_com_nota_enem: int = Field(
        alias="Concluintes participantes com nota no Enem",
    )
    proporcao_concluintes_com_nota_enem: float = Field(
        alias="Proporção de concluintes participantes com nota no Enem",
    )
    nota_bruta_idd: float = Field(alias="Nota Bruta - IDD")
    nota_padronizada_idd: float = Field(alias="Nota Padronizada - IDD")
    nota_bruta_org_didatico_pedagogica: float = Field(
        alias="Nota Bruta - Organização Didático-Pedagógica",
    )
    nota_padronizada_org_didatico_pedagogica: float = Field(
        alias="Nota Padronizada - Organização Didático-Pedagógica",
    )
    nota_bruta_infraestrutura: float = Field(
        alias="Nota Bruta - Infraestrutura e Instalações Físicas",
    )
    nota_padronizada_infraestrutura: float = Field(
        alias="Nota Padronizada - Infraestrutura e Instalações Físicas",
    )
    nota_bruta_oportunidade_ampliacao: float = Field(
        alias="Nota Bruta - Oportunidade de Ampliação da Formação",
    )
    nota_padronizada_oportunidade_ampliacao: float = Field(
        alias="Nota Padronizada - Oportunidade de Ampliação da Formação",
    )
    nota_bruta_mestres: float = Field(alias="Nota Bruta - Mestres")
    nota_padronizada_mestres: float = Field(alias="Nota Padronizada - Mestres")
    nota_bruta_doutores: float = Field(alias="Nota Bruta - Doutores")
    nota_padronizada_doutores: float = Field(alias="Nota Padronizada - Doutores")
    nota_bruta_regime_trabalho: float = Field(alias="Nota Bruta - Regime de Trabalho")
    nota_padronizada_regime_trabalho: float = Field(
        alias="Nota Padronizada - Regime de Trabalho",
    )
    cpc_continuo: float = Field(alias="CPC (Contínuo)")
    cpc_faixa: str = Field(
        alias="CPC (Faixa)",
        description="Faixa 1-5; pode ser 'SC' (sem conceito) em anos sem Enade",
    )
