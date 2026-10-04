import { StatTile, type StatTilePoint } from "@/components/cards/StatTile";
import { BrasilMapaCard } from "@/components/charts/BrasilMapaCard";
import { CpcComparativoCard } from "@/components/charts/CpcComparativoCard";
import { EvasaoHeatmapCard } from "@/components/charts/EvasaoHeatmapCard";
import { IngressantesTrendCard } from "@/components/charts/IngressantesTrendCard";
import { CampusSelect } from "@/components/layout/CampusSelect";
import { DataState } from "@/components/layout/DataState";
import { PageHeader } from "@/components/layout/PageHeader";
import type { CurvaSobrevivenciaPonto, DashboardData } from "@/types/dashboard";

export function HomePage() {
    return (
        <DataState
            render={(data) => <Home key={data.escopo.codigo_municipio} data={data} />}
        />
    );
}

/** Histórico de uma taxa na mesma "idade" de turma (``anos`` desde o
 * ingresso), por ano de ingresso, na média dos cursos — assim cada ponto é
 * comparável e o último é exatamente o KPI do campus. */
function historicoTaxa(
    curva: CurvaSobrevivenciaPonto[],
    anos: number,
    campo: "taxa_conclusao_acumulada" | "taxa_desistencia_acumulada"
): StatTilePoint[] {
    const porAno = new Map<number, number[]>();
    for (const p of curva) {
        const v = p[campo];
        if (p.anos_desde_ingresso !== anos || v === null) continue;
        porAno.set(p.ano_ingresso, [...(porAno.get(p.ano_ingresso) ?? []), v]);
    }
    return [...porAno.entries()]
        .map(([ano, vs]) => ({ ano, valor: vs.reduce((a, b) => a + b, 0) / vs.length }))
        .sort((a, b) => a.ano - b.ano);
}

function Home({ data }: { data: DashboardData }) {
    const { campus, cursos, curso_perfil: perfil } = data;
    const nacional = data.medias_nacionais.campus.kpis;

    // os KPIs do campus são da turma mais recente, nesta "idade" de curso
    const ref = perfil.kpis.find(
        (k) => k.ano_ingresso_referencia !== null && k.ano_referencia !== null
    );
    const anos = ref ? ref.ano_referencia! - ref.ano_ingresso_referencia! : null;
    const serie = (campo: Parameters<typeof historicoTaxa>[2]) =>
        anos === null ? [] : historicoTaxa(perfil.curva_sobrevivencia, anos, campo);
    const infoTurma = ref
        ? `Média dos cursos para a turma de ${ref.ano_ingresso_referencia}, ${anos} anos após o ingresso. A linha mostra a mesma taxa nas turmas anteriores.`
        : "Média dos cursos, turma mais recente.";

    return (
        <>
            <PageHeader
                title="Olá, bem-vindo ao PROGRAD Analytics!"
                subtitle={
                    <>
                        Acompanhe os indicadores da graduação do UFC Campus{" "}
                        <CampusSelect />
                    </>
                }
            />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
                <IngressantesTrendCard
                    className="lg:col-span-8"
                    tendencia={campus.tendencia_ingressantes}
                    demanda={data.trajetoria_comparada.demanda_ingressantes}
                    nacional={data.medias_nacionais.ingressantes}
                    cursos={cursos}
                />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:gap-6">
                    <StatTile
                        label="Taxa de conclusão"
                        info={infoTurma}
                        value={campus.kpis.taxa_conclusao_media}
                        nationalValue={nacional.taxa_conclusao_media_nacional}
                        higherIsBetter
                        serie={serie("taxa_conclusao_acumulada")}
                        serieLabel="Conclusão por turma de ingresso"
                    />
                    <StatTile
                        label="Taxa de evasão"
                        info={infoTurma}
                        value={campus.kpis.taxa_desistencia_media}
                        nationalValue={nacional.taxa_desistencia_media_nacional}
                        higherIsBetter={false}
                        serie={serie("taxa_desistencia_acumulada")}
                        serieLabel="Evasão por turma de ingresso"
                    />
                </div>

                <BrasilMapaCard
                    className="lg:col-span-4"
                    distribuicao={data.medias_nacionais.distribuicao_uf}
                    cursos={cursos}
                />
                <CpcComparativoCard
                    className="lg:col-span-8"
                    evolucao={perfil.evolucao_cpc}
                    nacional={data.medias_nacionais.evolucao_cpc}
                    cursos={cursos}
                />
                <EvasaoHeatmapCard
                    className="lg:col-span-12"
                    cursos={cursos}
                    local={data.trajetoria_comparada.heatmap_evasao_anual}
                    nacional={data.medias_nacionais.heatmap_evasao_anual}
                />
            </div>
        </>
    );
}
