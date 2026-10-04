import { chaveAreaAno, faixaNumero } from "@/lib/cpc";
import { toTitleCase } from "@/lib/format";
import type {
    Curso,
    DashboardData,
    EvolucaoCpcPonto,
    PerfilRadar,
    PerfilRadarNacional,
} from "@/types/dashboard";

/** Um ciclo do Enade com CPC calculado. */
export interface Ciclo {
    ano: number;
    cpc: number;
    faixa: number | null;
}

/** Um curso do campus na aba Qualidade: a avaliação mais recente (ano, CPC,
 * faixa, Enade, notas), a média nacional da mesma área no mesmo ano e o
 * ciclo anterior. ``ano === null`` = curso nunca avaliado. */
export interface AvaliacaoCurso {
    codigo: number;
    nome: string;
    area: string | null;
    ano: number | null;
    cpc: number | null;
    /** 1-5; null = sem conceito (SC, não reconhecido, sem avaliação). */
    faixa: number | null;
    enade: number | null;
    perfil: PerfilRadar | undefined;
    nacional: PerfilRadarNacional | undefined;
    cpcNacional: number | null;
    cursosNacional: number | null;
    anterior: Ciclo | null;
    /** Todas as edições do curso, da mais antiga à mais recente. */
    historico: EvolucaoCpcPonto[];
}

/** Nome de exibição de cada curso, sem repetição: o INEP registra cursos
 * diferentes com o mesmo nome no mesmo campus (turno, grau). Repetidos ganham
 * o grau quando ele os diferencia, e o código do curso quando nem isso basta. */
export function rotulosCursos(cursos: Curso[]): Map<number, string> {
    const chave = (c: Curso) => c.nome_curso.trim().toLocaleUpperCase("pt-BR");
    const grupos = new Map<string, Curso[]>();
    for (const c of cursos) grupos.set(chave(c), [...(grupos.get(chave(c)) ?? []), c]);
    const rotulos = new Map<number, string>();
    for (const grupo of grupos.values()) {
        const graus = new Set(grupo.map((c) => c.grau_academico));
        for (const c of grupo) {
            const partes = [toTitleCase(c.nome_curso)];
            if (graus.size > 1 && c.grau_academico) partes.push(c.grau_academico);
            const mesmoGrau = grupo.filter(
                (o) => graus.size === 1 || o.grau_academico === c.grau_academico
            );
            if (mesmoGrau.length > 1) partes.push(`cód. ${c.codigo_curso}`);
            rotulos.set(c.codigo_curso, partes.join(" · "));
        }
    }
    return rotulos;
}

export function buildAvaliacoes(data: DashboardData): AvaliacaoCurso[] {
    const rotulos = rotulosCursos(data.cursos);
    const { perfil_radar: perfis, evolucao_cpc: evolucao } = data.curso_perfil;
    const nacionalComp = new Map(
        data.medias_nacionais.perfil_radar.map((n) => [
            chaveAreaAno(n.area_avaliacao, n.ano),
            n,
        ])
    );
    const nacionalCpc = new Map(
        data.medias_nacionais.evolucao_cpc.map((n) => [
            chaveAreaAno(n.area_avaliacao, n.ano),
            n,
        ])
    );

    return data.cursos.map((curso) => {
        const perfil = perfis.find((p) => p.codigo_curso === curso.codigo_curso);
        const historico = evolucao
            .filter((e) => e.codigo_curso === curso.codigo_curso)
            .sort((a, b) => a.ano - b.ano);
        const nome = rotulos.get(curso.codigo_curso) ?? toTitleCase(curso.nome_curso);
        if (!perfil) {
            return {
                codigo: curso.codigo_curso,
                nome,
                area: null,
                ano: null,
                cpc: null,
                faixa: null,
                enade: null,
                perfil: undefined,
                nacional: undefined,
                cpcNacional: null,
                cursosNacional: null,
                anterior: null,
                historico,
            };
        }
        const chave = chaveAreaAno(perfil.area_avaliacao, perfil.ano);
        const anterior = historico
            .filter((e) => e.ano < perfil.ano && e.cpc_continuo !== null)
            .at(-1);
        return {
            codigo: curso.codigo_curso,
            nome,
            area: perfil.area_avaliacao,
            ano: perfil.ano,
            cpc: perfil.cpc_continuo,
            faixa: faixaNumero(perfil.cpc_faixa),
            enade: perfil.conceito_enade_continuo,
            perfil,
            nacional: nacionalComp.get(chave),
            cpcNacional: nacionalCpc.get(chave)?.cpc_continuo_medio_nacional ?? null,
            cursosNacional:
                nacionalCpc.get(chave)?.quantidade_cursos_considerados ?? null,
            anterior: anterior
                ? {
                      ano: anterior.ano,
                      cpc: anterior.cpc_continuo!,
                      faixa: faixaNumero(anterior.cpc_faixa),
                  }
                : null,
            historico,
        };
    });
}

/** Cursos com CPC calculado na avaliação mais recente. */
export function comCpc(
    avaliacoes: AvaliacaoCurso[]
): (AvaliacaoCurso & { cpc: number; ano: number })[] {
    return avaliacoes.filter(
        (a): a is AvaliacaoCurso & { cpc: number; ano: number } =>
            a.cpc !== null && a.ano !== null
    );
}

export const media = (values: number[]): number | null =>
    values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
