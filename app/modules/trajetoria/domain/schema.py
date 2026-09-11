from pydantic import BaseModel, Field


class TrajetoriaRow(BaseModel):
    """Schema do dataset Trajetória (Indicadores de Trajetória da Educação Superior).

    Fonte da verdade das colunas: nome do campo = normalizado, ``alias`` = nome
    original do arquivo. Nunca é
    instanciado; serve só para introspecção via ``model_to_specs``.
    """

    codigo_ies: int = Field(alias="Código da Instituição")
    nome_ies: str = Field(alias="Nome da Instituição")
    tp_categoria_administrativa: int = Field(alias="Categoria Administrativa")
    tp_organizacao_academica: int = Field(alias="Organização Acadêmica")
    codigo_curso: int = Field(alias="Código do Curso de Graduação")
    nome_curso: str = Field(alias="Nome do Curso de Graduação")
    codigo_regiao: int = Field(alias="Código da Região Geográfica do Curso")
    codigo_uf: int = Field(alias="Código da Unidade Federativa do Curso")
    codigo_municipio: int = Field(alias="Código do Município do Curso")
    tp_grau_academico: int = Field(alias="Grau Acadêmico")
    tp_modalidade_ensino: int = Field(alias="Modalidade de Ensino")
    codigo_cine_area_geral: str = Field(
        alias="Código da área do Curso segundo a classificação CINE BRASIL",
    )
    nome_cine_area_geral: str = Field(
        alias="Nome da área do Curso segundo a classificação CINE BRASIL",
    )
    codigo_cine_rotulo: str = Field(
        alias="Código da Grande Área do Curso segundo a classificação CINE BRASIL",
    )
    nome_cine_rotulo: str = Field(
        alias="Nome da Grande Área do Curso segundo a classificação CINE BRASIL",
    )
    ano_ingresso: int = Field(alias="Ano de Ingresso")
    ano_referencia: int = Field(alias="Ano de Referência")
    prazo_integralizacao: int = Field(alias="Prazo de Integralização em Anos")
    ano_integralizacao: int = Field(alias="Ano de Integralização do Curso")
    prazo_acompanhamento: int = Field(alias="Prazo de Acompanhamento do Curso em anos")
    ano_maximo_acompanhamento: int = Field(
        alias="Ano Máximo de Acompanhamento do Curso"
    )
    qt_ingressante: int = Field(alias="Quantidade de Ingressantes no Curso")
    qt_permanencia: int = Field(
        alias="Quantidade de Permanência no Curso no ano de referência",
    )
    qt_concluinte: int = Field(
        alias="Quantidade de Concluintes no Curso no ano de referência",
    )
    qt_desistencia: int = Field(
        alias="Quantidade de Desistência no Curso no ano de referência",
    )
    qt_falecido: int = Field(
        alias="Quantidade de Falecimentos no Curso no ano de referência",
    )
    taxa_permanencia: float = Field(
        alias="Taxa de Permanência - TAP",
        description="Percentual de ingressantes com vínculo ativo no ano de referência",
    )
    taxa_conclusao_acumulada: float = Field(
        alias="Taxa de Conclusão Acumulada - TCA",
        description="Percentual de ingressantes que concluíram até o ano de referência",
    )
    taxa_desistencia_acumulada: float = Field(
        alias="Taxa de Desistência Acumulada - TDA",
        description="Percentual de ingressantes que desistiram até o ano de referência",
    )
    taxa_conclusao_anual: float = Field(
        alias="Taxa de Conclusão Anual - TCAN",
        description="Percentual de ingressantes que concluíram no ano de referência",
    )
    taxa_desistencia_anual: float = Field(
        alias="Taxa de Desistência Anual - TADA",
        description="Percentual de ingressantes que desistiram no ano de referência",
    )
