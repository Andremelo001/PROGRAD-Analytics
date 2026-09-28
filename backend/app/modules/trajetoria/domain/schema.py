from pydantic import BaseModel, Field


class TrajetoriaRow(BaseModel):
    """Schema do dataset Trajetória (Indicadores de Trajetória da Educação Superior).

    Contrato interno: nome do campo = nome normalizado usado no CSV final e no
    dashboard; anotação = tipo alvo. Os nomes que cada coluna tem nos arquivos
    do INEP e os rótulos das colunas codificadas ficam fora do código, em
    ``colunas_inep.json`` (seção ``trajetoria``). Nunca é instanciado; serve só
    para introspecção via ``model_to_specs``.
    """

    codigo_ies: int
    nome_ies: str
    tp_categoria_administrativa: int
    tp_organizacao_academica: int
    codigo_curso: int
    nome_curso: str
    codigo_regiao: int
    codigo_uf: int
    codigo_municipio: int
    tp_grau_academico: int
    tp_modalidade_ensino: int
    codigo_cine_area_geral: str
    nome_cine_area_geral: str
    codigo_cine_rotulo: str
    nome_cine_rotulo: str
    ano_ingresso: int
    ano_referencia: int
    prazo_integralizacao: int
    ano_integralizacao: int
    prazo_acompanhamento: int
    ano_maximo_acompanhamento: int
    qt_ingressante: int
    qt_permanencia: int
    qt_concluinte: int
    qt_desistencia: int
    qt_falecido: int
    taxa_permanencia: float = Field(
        description="Percentual de ingressantes com vínculo ativo no ano de referência",
    )
    taxa_conclusao_acumulada: float = Field(
        description="Percentual de ingressantes que concluíram até o ano de referência",
    )
    taxa_desistencia_acumulada: float = Field(
        description="Percentual de ingressantes que desistiram até o ano de referência",
    )
    taxa_conclusao_anual: float = Field(
        description="Percentual de ingressantes que concluíram no ano de referência",
    )
    taxa_desistencia_anual: float = Field(
        description="Percentual de ingressantes que desistiram no ano de referência",
    )
