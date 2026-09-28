import { AlertsCard } from "@/components/cards/AlertsCard";
import { StatTile } from "@/components/cards/StatTile";
import { CpcComparativoCard } from "@/components/charts/CpcComparativoCard";
import { CpcFaixaCard } from "@/components/charts/CpcFaixaCard";
import { IngressantesTrendCard } from "@/components/charts/IngressantesTrendCard";
import { DataState } from "@/components/layout/DataState";
import { PageHeader } from "@/components/layout/PageHeader";
import { CourseSearch } from "@/components/search/CourseSearch";

export function HomePage() {
    return (
        <DataState
            render={(data) => (
                <div className="flex flex-col gap-4 lg:h-full lg:min-h-0 lg:gap-5">
                    <PageHeader
                        title="Olá, Bem-Vindo ao PROGRAD Analytics"
                        subtitle="Visualize dados, insights a partir de painéis estruturados e de fácil visualização"
                        aside={<CourseSearch cursos={data.cursos} />}
                    />

                    {/* lg+: 3 colunas x 2 linhas, e a grade ocupa exatamente o que
                        sobra da altura da tela (sem scroll). Linha 1 = cards pequenos
                        (altura dos stat tiles; o de alertas não estica a linha —
                        h-0 + min-h-full — e rola por dentro se precisar), linha 2 =
                        gráficos (o resto). Abaixo de lg: 2 colunas (md) ou 1, e a
                        página rola. */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-5">
                        <AlertsCard
                            className="md:col-span-2 lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:h-0 lg:min-h-full"
                            itens={data.alertas.itens}
                        />
                        <StatTile
                            className="lg:col-start-1 lg:row-start-1"
                            label="Taxa de conclusão"
                            caption="Média dos cursos, coorte mais recente"
                            value={data.campus.kpis.taxa_conclusao_media}
                            nationalValue={
                                data.medias_nacionais.campus.kpis
                                    .taxa_conclusao_media_nacional
                            }
                            higherIsBetter
                        />
                        <StatTile
                            className="lg:col-start-2 lg:row-start-1"
                            label="Taxa de evasão"
                            caption="Média dos cursos, coorte mais recente"
                            value={data.campus.kpis.taxa_desistencia_media}
                            nationalValue={
                                data.medias_nacionais.campus.kpis
                                    .taxa_desistencia_media_nacional
                            }
                            higherIsBetter={false}
                        />
                        <CpcFaixaCard
                            className="min-h-[340px] lg:col-start-2 lg:row-start-2 lg:min-h-0"
                            dist={data.campus.distribuicao_cpc_faixa}
                            distNacional={
                                data.medias_nacionais.campus.distribuicao_cpc_faixa
                            }
                            totalCursos={data.campus.kpis.total_cursos}
                            atualizadoEm={data.fontes.qualidade?.gerado_em ?? null}
                        />
                        <IngressantesTrendCard
                            className="min-h-[340px] lg:col-start-1 lg:row-start-2 lg:min-h-0"
                            data={data.campus.tendencia_ingressantes}
                            atualizadoEm={data.fontes.trajetoria?.gerado_em ?? null}
                        />
                        <CpcComparativoCard
                            className="min-h-[340px] md:col-span-2 lg:col-span-1 lg:col-start-3 lg:row-start-2 lg:min-h-0"
                            evolucao={data.curso_perfil.evolucao_cpc}
                            nacional={data.medias_nacionais.evolucao_cpc}
                            atualizadoEm={data.fontes.qualidade?.gerado_em ?? null}
                        />
                    </div>
                </div>
            )}
        />
    );
}
