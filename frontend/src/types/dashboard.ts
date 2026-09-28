// Espelha exatamente a forma de backend/app/data/processed/dashboard.json.
// Fonte de verdade real: docs/dashboard_dados.md e
// backend/app/modules/dashboard/domain/services/*.py — atualize os dois lados juntos
// se um campo mudar.

export interface Escopo {
    codigo_ies: number;
    nome_ies: string | null;
    sigla_ies: string | null;
    codigo_municipio: number;
    municipio: string;
}

export interface Curso {
    codigo_curso: number;
    nome_curso: string;
    grau_academico: string | null;
    modalidade_ensino: string | null;
}

export interface FonteInfo {
    gerado_em: string | null;
    linhas: number | null;
}

export interface Fontes {
    qualidade?: FonteInfo;
    trajetoria?: FonteInfo;
}

// --- A. curso_perfil -------------------------------------------------------

export interface KpiCurso {
    codigo_curso: number;
    nome_curso: string;
    ano_qualidade: number | null;
    cpc_continuo: number | null;
    cpc_faixa: string | null;
    conceito_enade_continuo: number | null;
    // coorte de ingresso mais recente, no seu ano de acompanhamento mais
    // recente — os dois anos vêm juntos de propósito, ver docs/dashboard_dados.md.
    ano_ingresso_referencia: number | null;
    ano_referencia: number | null;
    qt_ingressante: number | null;
    taxa_permanencia: number | null;
    taxa_conclusao_acumulada: number | null;
    taxa_desistencia_acumulada: number | null;
}

export interface EvolucaoCpcPonto {
    codigo_curso: number;
    nome_curso: string;
    area_avaliacao: string;
    ano: number;
    cpc_continuo: number | null;
    cpc_faixa: string | null;
    conceito_enade_continuo: number | null;
}

/** As 9 notas padronizadas (escala 0-5) — eixos do radar. */
export interface PerfilRadar {
    codigo_curso: number;
    nome_curso: string;
    area_avaliacao: string;
    formacao_geral: number | null;
    componente_especifico: number | null;
    idd: number | null;
    organizacao_didatico_pedagogica: number | null;
    infraestrutura: number | null;
    oportunidade_ampliacao: number | null;
    mestres: number | null;
    doutores: number | null;
    regime_trabalho: number | null;
}

export interface FunilCoorte {
    codigo_curso: number;
    nome_curso: string;
    ano_ingresso: number;
    ano_referencia: number;
    qt_ingressante: number;
    qt_permanencia: number;
    qt_concluinte: number;
    qt_desistencia: number;
    qt_falecido: number;
}

export interface CurvaSobrevivenciaPonto {
    codigo_curso: number;
    nome_curso: string;
    nome_cine_area_geral: string | null;
    ano_ingresso: number;
    ano_referencia: number;
    anos_desde_ingresso: number;
    taxa_permanencia: number | null;
    taxa_conclusao_acumulada: number | null;
    taxa_desistencia_acumulada: number | null;
}

export interface CursoPerfil {
    kpis: KpiCurso[];
    evolucao_cpc: EvolucaoCpcPonto[];
    perfil_radar: PerfilRadar[];
    funil_coortes: FunilCoorte[];
    curva_sobrevivencia: CurvaSobrevivenciaPonto[];
}

// --- B. comparacao_cursos ---------------------------------------------------

export interface RankingCpcItem {
    codigo_curso: number;
    nome_curso: string;
    ano: number;
    cpc_continuo: number | null;
}

export interface TabelaComparativaLinha {
    codigo_curso: number;
    nome_curso: string;
    cpc_faixa: string | null;
    conceito_enade_continuo: number | null;
    taxa_conclusao_acumulada: number | null;
    taxa_desistencia_acumulada: number | null;
    taxa_permanencia: number | null;
}

export interface ComparacaoCursos {
    ranking_cpc: RankingCpcItem[];
    tabela_comparativa: TabelaComparativaLinha[];
    // reaproveitam A3/A2 tal e qual — não são cálculos novos.
    notas_por_dimensao: PerfilRadar[];
    evolucao_cpc_comparada: EvolucaoCpcPonto[];
}

// --- C. trajetoria_comparada -------------------------------------------------

export interface EvasaoPorCursoPonto {
    codigo_curso: number;
    nome_curso: string;
    nome_cine_area_geral: string | null;
    ano_ingresso: number;
    ano_referencia: number;
    anos_desde_ingresso: number;
    taxa_desistencia_acumulada: number | null;
}

export interface HeatmapEvasaoAnualCelula {
    codigo_curso: number;
    nome_curso: string;
    nome_cine_area_geral: string | null;
    ano_referencia: number;
    taxa_desistencia_anual: number | null;
}

export interface DemandaIngressantesPonto {
    codigo_curso: number;
    nome_curso: string;
    ano_ingresso: number;
    qt_ingressante: number;
}

export interface TrajetoriaComparada {
    evasao_por_curso: EvasaoPorCursoPonto[];
    heatmap_evasao_anual: HeatmapEvasaoAnualCelula[];
    demanda_ingressantes: DemandaIngressantesPonto[];
}

// --- D. campus ---------------------------------------------------------------

export interface CampusKpis {
    total_cursos: number;
    total_ingressantes_ultimo_ano: number | null;
    taxa_conclusao_media: number | null;
    taxa_desistencia_media: number | null;
}

export interface DistribuicaoCpcFaixaItem {
    cpc_faixa: string;
    quantidade_cursos: number;
}

export interface TendenciaIngressantesPonto {
    ano_ingresso: number;
    qt_ingressante: number;
}

export interface Campus {
    kpis: CampusKpis;
    distribuicao_cpc_faixa: DistribuicaoCpcFaixaItem[];
    tendencia_ingressantes: TendenciaIngressantesPonto[];
}

// --- E. medias_nacionais -------------------------------------------------------

export interface EvolucaoCpcNacionalPonto {
    area_avaliacao: string;
    ano: number;
    cpc_continuo_medio_nacional: number;
    quantidade_cursos_considerados: number;
}

export interface PerfilRadarNacional {
    area_avaliacao: string;
    formacao_geral: number;
    componente_especifico: number;
    idd: number;
    organizacao_didatico_pedagogica: number;
    infraestrutura: number;
    oportunidade_ampliacao: number;
    mestres: number;
    doutores: number;
    regime_trabalho: number;
    quantidade_cursos_considerados: number;
}

export interface CurvaSobrevivenciaNacionalPonto {
    nome_cine_area_geral: string;
    anos_desde_ingresso: number;
    taxa_permanencia_media_nacional: number;
    taxa_conclusao_acumulada_media_nacional: number;
    taxa_desistencia_acumulada_media_nacional: number;
    quantidade_cursos_considerados: number;
}

export interface HeatmapEvasaoNacionalCelula {
    nome_cine_area_geral: string;
    ano_referencia: number;
    taxa_desistencia_anual_media_nacional: number;
    quantidade_cursos_considerados: number;
}

export interface CampusNacionalKpis {
    taxa_conclusao_media_nacional: number | null;
    taxa_desistencia_media_nacional: number | null;
    quantidade_cursos_considerados: number;
}

export interface DistribuicaoCpcFaixaNacionalItem {
    cpc_faixa: string;
    percentual_nacional: number;
}

export interface CampusNacional {
    kpis: CampusNacionalKpis;
    distribuicao_cpc_faixa: DistribuicaoCpcFaixaNacionalItem[];
}

/** Médias só do grupo de pares (mesma área/classificação de curso do
 * campus) — nunca o Brasil inteiro misturado. Ver docs/dashboard_dados.md. */
export interface MediasNacionais {
    evolucao_cpc: EvolucaoCpcNacionalPonto[];
    perfil_radar: PerfilRadarNacional[];
    curva_sobrevivencia: CurvaSobrevivenciaNacionalPonto[];
    heatmap_evasao_anual: HeatmapEvasaoNacionalCelula[];
    campus: CampusNacional;
}

// --- F. alertas ----------------------------------------------------------------

export type AlertaTipo = "sem_cpc" | "cpc_faixa_baixa" | "evasao_acima_da_media";
export type AlertaSeveridade = "atencao" | "critico";

export interface AlertaItem {
    tipo: AlertaTipo;
    severidade: AlertaSeveridade;
    mensagem: string;
    cursos: string[];
}

export interface Alertas {
    itens: AlertaItem[];
}

// --- raiz ------------------------------------------------------------------

export interface DashboardData {
    gerado_em: string;
    escopo: Escopo;
    cursos: Curso[];
    fontes: Fontes;
    curso_perfil: CursoPerfil;
    comparacao_cursos: ComparacaoCursos;
    trajetoria_comparada: TrajetoriaComparada;
    campus: Campus;
    medias_nacionais: MediasNacionais;
    alertas: Alertas;
}
