from pydantic import BaseModel, Field


class CpcRow(BaseModel):
    """Schema do dataset CPC (Indicadores de Qualidade da Educação Superior).

    Contrato interno: nome do campo = nome normalizado usado no CSV final e no
    dashboard; anotação = tipo alvo. Os nomes que cada coluna tem nos arquivos
    do INEP ficam fora do código, em ``colunas_inep.json`` (seção
    ``qualidade``). Nunca é instanciado; serve só para introspecção via
    ``model_to_specs``.
    """

    ano: int
    codigo_ies: int
    nome_ies: str
    sigla_ies: str
    organizacao_academica: str
    categoria_administrativa: str
    codigo_curso: int
    codigo_area: int
    area_avaliacao: str
    modalidade_ensino: str
    codigo_municipio: int
    municipio_curso: str
    sigla_uf: str
    n_concluintes_inscritos: int
    n_concluintes_participantes: int
    nota_bruta_fg: float
    nota_padronizada_fg: float
    nota_bruta_ce: float
    nota_padronizada_ce: float
    conceito_enade_continuo: float
    n_concluintes_com_nota_enem: int
    proporcao_concluintes_com_nota_enem: float
    nota_bruta_idd: float
    nota_padronizada_idd: float
    nota_bruta_org_didatico_pedagogica: float
    nota_padronizada_org_didatico_pedagogica: float
    nota_bruta_infraestrutura: float
    nota_padronizada_infraestrutura: float
    nota_bruta_oportunidade_ampliacao: float
    nota_padronizada_oportunidade_ampliacao: float
    nota_bruta_mestres: float
    nota_padronizada_mestres: float
    nota_bruta_doutores: float
    nota_padronizada_doutores: float
    nota_bruta_regime_trabalho: float
    nota_padronizada_regime_trabalho: float
    cpc_continuo: float
    cpc_faixa: str = Field(
        description="Faixa 1-5; pode ser 'SC' (sem conceito) em anos sem Enade",
    )
