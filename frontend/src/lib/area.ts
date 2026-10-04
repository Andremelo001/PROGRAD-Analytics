import { COMPONENTES, type ComponenteKey } from "@/lib/cpc";
import { formatDecimal, formatInteger, formatPercent, toTitleCase } from "@/lib/format";
import { media } from "@/lib/qualidade";
import type { AreaArquivo } from "@/types/qualidade-area";

/** Uma edição do Enade de um curso (CPC e participação). */
export interface Edicao {
    ano: number;
    cpc: number | null;
    faixa: number | null;
    inscritos: number | null;
    participantes: number | null;
}

/** Um curso do Brasil numa área de avaliação (edição mais recente). */
export interface CursoArea {
    codigo: number;
    ies: number;
    nomeIes: string;
    siglaIes: string | null;
    publica: boolean | null;
    municipio: number;
    nomeMunicipio: string;
    uf: string;
    ead: boolean;
    cpc: number | null;
    faixa: number | null;
    notas: Record<ComponenteKey, number | null>;
    /** Da IES do painel (UFC). */
    destaque: boolean;
    /** Todas as edições do curso, da mais antiga à mais recente. */
    historico: Edicao[];
}

/** Desfaz o formato colunar do JSON da área. */
export function parseArea(arquivo: AreaArquivo): CursoArea[] {
    const col = Object.fromEntries(arquivo.colunas.map((c, i) => [c, i]));
    const ed = Object.fromEntries(arquivo.colunas_edicao.map((c, i) => [c, i]));
    return arquivo.cursos.flatMap((linha) => {
        const get = (nome: string) => linha[col[nome]];
        const ies = Number(get("codigo_ies"));
        const municipio = Number(get("codigo_municipio"));
        const [nomeIes, siglaIes, publica] = arquivo.ies[String(ies)] ?? [
            null,
            null,
            null,
        ];
        const [nomeMunicipio, uf] = arquivo.municipios[String(municipio)] ?? [
            null,
            null,
        ];
        if (!uf) return [];
        const notas = Object.fromEntries(
            COMPONENTES.map((c) => [c.key, get(c.key) as number | null])
        ) as Record<ComponenteKey, number | null>;
        return [
            {
                codigo: Number(get("codigo_curso")),
                ies,
                nomeIes: nomeIes ? toTitleCase(nomeIes) : "Instituição sem nome",
                siglaIes,
                publica,
                municipio,
                nomeMunicipio: nomeMunicipio ? toTitleCase(nomeMunicipio) : "—",
                uf,
                ead: Boolean(get("ead")),
                cpc: get("cpc_continuo") as number | null,
                faixa: get("cpc_faixa") as number | null,
                notas,
                destaque: ies === arquivo.codigo_ies_destaque,
                historico: ((get("historico") ?? []) as (number | null)[][]).map(
                    (e) => ({
                        ano: e[ed.ano] as number,
                        cpc: e[ed.cpc_continuo],
                        faixa: e[ed.cpc_faixa],
                        inscritos: e[ed.n_concluintes_inscritos],
                        participantes: e[ed.n_concluintes_participantes],
                    })
                ),
            },
        ];
    });
}

/** Resumo de um conjunto de cursos (Brasil, um estado, um município). */
export interface ResumoArea {
    cursos: number;
    comCpc: number;
    cpcMedio: number | null;
    iddMedio: number | null;
    /** % dos cursos com faixa que estão na 4 ou na 5. */
    pctAltas: number | null;
    /** Quantos cursos em cada faixa: índices 0-4 = faixas 1-5, 5 = sem conceito. */
    faixas: number[];
    notas: Record<ComponenteKey, number | null>;
}

const valores = (cursos: CursoArea[], get: (c: CursoArea) => number | null) =>
    cursos.flatMap((c) => {
        const v = get(c);
        return v === null ? [] : [v];
    });

export function resumir(cursos: CursoArea[]): ResumoArea {
    const faixas = [0, 0, 0, 0, 0, 0];
    for (const c of cursos) faixas[c.faixa === null ? 5 : c.faixa - 1]++;
    const comFaixa = faixas.slice(0, 5).reduce((a, b) => a + b, 0);
    return {
        cursos: cursos.length,
        comCpc: cursos.filter((c) => c.cpc !== null).length,
        cpcMedio: media(valores(cursos, (c) => c.cpc)),
        iddMedio: media(valores(cursos, (c) => c.notas.idd)),
        pctAltas: comFaixa > 0 ? (100 * (faixas[3] + faixas[4])) / comFaixa : null,
        faixas,
        notas: Object.fromEntries(
            COMPONENTES.map((comp) => [
                comp.key,
                media(valores(cursos, (c) => c.notas[comp.key])),
            ])
        ) as Record<ComponenteKey, number | null>,
    };
}

export function agrupar<K>(cursos: CursoArea[], chave: (c: CursoArea) => K) {
    const grupos = new Map<K, CursoArea[]>();
    for (const c of cursos) {
        const k = chave(c);
        grupos.set(k, [...(grupos.get(k) ?? []), c]);
    }
    return grupos;
}

export type Indicador = "cpc" | "idd" | "altas" | "cursos";

export const INDICADORES: Record<
    Indicador,
    {
        label: string;
        /** Pro seletor do Mapa (cabe na linha do título). */
        curto: string;
        valor: (r: ResumoArea) => number | null;
        formato: "nota" | "pct" | "n";
    }
> = {
    cpc: {
        label: "CPC médio",
        curto: "CPC médio",
        valor: (r) => r.cpcMedio,
        formato: "nota",
    },
    idd: {
        label: "IDD médio",
        curto: "IDD médio",
        valor: (r) => r.iddMedio,
        formato: "nota",
    },
    altas: {
        label: "% nas faixas 4 e 5",
        curto: "% faixas 4–5",
        valor: (r) => r.pctAltas,
        formato: "pct",
    },
    cursos: {
        label: "Nº de cursos",
        curto: "Nº de cursos",
        valor: (r) => r.cursos,
        formato: "n",
    },
};

export type Rede = "todas" | "publicas" | "privadas";

/** Rótulo curto de cada rede, pro seletor (o longo vai no subtítulo). */
export const REDES_CURTO: Record<Rede, string> = {
    todas: "Todas",
    publicas: "Públicas",
    privadas: "Privadas",
};

export const REDES: Record<Rede, string> = {
    todas: "Todas as redes",
    publicas: "Públicas",
    privadas: "Privadas",
};

export function filtrar(cursos: CursoArea[], rede: Rede, ead: boolean): CursoArea[] {
    return cursos.filter(
        (c) =>
            c.ead === ead &&
            (rede === "todas" ||
                (rede === "publicas" ? c.publica === true : c.publica === false))
    );
}

/** Melhores CPCs primeiro (sem CPC no fim). */
export function ranking(cursos: CursoArea[]): CursoArea[] {
    return [...cursos].sort((a, b) => (b.cpc ?? -1) - (a.cpc ?? -1));
}

/** % dos cursos com CPC que ficaram abaixo de ``cpc``. */
export function percentil(cursos: CursoArea[], cpc: number): number | null {
    const outros = valores(cursos, (c) => c.cpc);
    if (outros.length === 0) return null;
    return (100 * outros.filter((v) => v < cpc).length) / outros.length;
}

export function formatIndicador(indicador: Indicador, valor: number | null): string {
    if (valor === null) return "—";
    const { formato } = INDICADORES[indicador];
    return formato === "nota"
        ? formatDecimal(valor)
        : formato === "pct"
          ? formatPercent(valor, 0)
          : formatInteger(valor);
}
