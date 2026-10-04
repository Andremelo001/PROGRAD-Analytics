import { Info } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/cards/Card";
import { DeltaPill } from "@/components/charts/qualidade/DeltaPill";
import { useChartTheme } from "@/hooks/useChartTheme";
import { formatDecimal, formatPercent, formatPoints } from "@/lib/format";
import { comCpc, media, type AvaliacaoCurso } from "@/lib/qualidade";
import type { DistribuicaoCpcFaixaNacionalItem } from "@/types/dashboard";

/** Quatro indicadores do campus no topo da Visão do campus: CPC médio,
 * cursos por faixa, % nas faixas 4-5 e cursos sem CPC. */
export function QualidadeResumo({
    avaliacoes,
    faixasNacional,
}: {
    avaliacoes: AvaliacaoCurso[];
    faixasNacional: DistribuicaoCpcFaixaNacionalItem[];
}) {
    const CHART = useChartTheme();
    const avaliados = comCpc(avaliacoes);

    // CPC médio × média nacional das mesmas áreas, nos mesmos anos (pareado:
    // só cursos que têm as duas pontas)
    const pareados = avaliados.filter((a) => a.cpcNacional !== null);
    const cpcMedio = media(avaliados.map((a) => a.cpc));
    const cpcNacional = media(pareados.map((a) => a.cpcNacional!));
    const cpcPareado = media(pareados.map((a) => a.cpc));

    const porFaixa = [1, 2, 3, 4, 5].map(
        (f) => avaliacoes.filter((a) => a.faixa === f).length
    );
    const comFaixa = porFaixa.reduce((a, b) => a + b, 0);
    const altas = porFaixa[3] + porFaixa[4];
    const pctAltas = comFaixa > 0 ? (100 * altas) / comFaixa : null;
    const pctAltasNacional = faixasNacional
        .filter((f) => f.cpc_faixa === "4" || f.cpc_faixa === "5")
        .reduce((total, f) => total + f.percentual_nacional, 0);
    const temNacional = faixasNacional.length > 0;

    const semCpc = avaliacoes.filter((a) => a.cpc === null);
    const nuncaAvaliados = semCpc.filter((a) => a.ano === null).length;

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-4 lg:gap-6">
            <Tile
                label="CPC médio"
                info="Média do CPC contínuo da avaliação mais recente de cada curso. A média nacional é a dos cursos das mesmas áreas, no mesmo ano de avaliação."
                value={cpcMedio === null ? "—" : formatDecimal(cpcMedio)}
                badge={
                    cpcPareado !== null && cpcNacional !== null ? (
                        <DeltaPill diff={cpcPareado - cpcNacional} />
                    ) : null
                }
                footer={
                    cpcNacional === null
                        ? "Sem média nacional para comparar"
                        : `Média nacional das mesmas áreas: ${formatDecimal(cpcNacional)}`
                }
            />
            <Tile
                label="Cursos por faixa"
                info="Faixa do CPC (1 a 5) na avaliação mais recente de cada curso."
                value={`${comFaixa} ${comFaixa === 1 ? "curso" : "cursos"}`}
                footer={
                    <span className="flex flex-col gap-2">
                        <span
                            className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full"
                            aria-hidden
                        >
                            {porFaixa.map((n, i) =>
                                n === 0 ? null : (
                                    <span
                                        key={i}
                                        style={{
                                            flexGrow: n,
                                            background: CHART.faixa.ramp[i],
                                        }}
                                    />
                                )
                            )}
                        </span>
                        <span className="flex flex-wrap gap-x-3 gap-y-1">
                            {porFaixa.map((n, i) =>
                                n === 0 ? null : (
                                    <span
                                        key={i}
                                        className="flex items-center gap-1.5 whitespace-nowrap"
                                    >
                                        <span
                                            aria-hidden
                                            className="h-2 w-2 rounded-[3px]"
                                            style={{ background: CHART.faixa.ramp[i] }}
                                        />
                                        Faixa {i + 1}:{" "}
                                        <span className="text-ink font-semibold">
                                            {n}
                                        </span>
                                    </span>
                                )
                            )}
                        </span>
                    </span>
                }
            />
            <Tile
                label="Nas faixas 4 e 5"
                info="Percentual dos cursos com faixa 4 ou 5. No Brasil, entre os cursos das mesmas áreas (avaliação mais recente de cada um)."
                value={pctAltas === null ? "—" : formatPercent(pctAltas, 0)}
                badge={
                    pctAltas !== null && temNacional ? (
                        <DeltaPill
                            diff={pctAltas - pctAltasNacional}
                            limiar={0.5}
                            format={(v) => formatPoints(v, 0)}
                        />
                    ) : null
                }
                footer={
                    temNacional
                        ? `No Brasil, nas mesmas áreas: ${formatPercent(pctAltasNacional, 0)}`
                        : "Sem dado nacional para comparar"
                }
            />
            <Tile
                label="Sem CPC"
                info="Cursos sem conceito na avaliação mais recente (SC) ou que ainda não passaram por avaliação — por exemplo, cursos novos, sem concluintes no Enade."
                value={`${semCpc.length} de ${avaliacoes.length}`}
                footer={
                    semCpc.length === 0
                        ? "Todos os cursos têm CPC"
                        : [
                              nuncaAvaliados > 0 &&
                                  `${nuncaAvaliados} nunca ${nuncaAvaliados === 1 ? "avaliado" : "avaliados"}`,
                              semCpc.length - nuncaAvaliados > 0 &&
                                  `${semCpc.length - nuncaAvaliados} sem conceito (SC)`,
                          ]
                              .filter(Boolean)
                              .join(" · ")
                }
            />
        </div>
    );
}

function Tile({
    label,
    info,
    value,
    badge,
    footer,
}: {
    label: string;
    info: string;
    value: string;
    badge?: ReactNode;
    footer: ReactNode;
}) {
    return (
        <Card className="relative overflow-hidden">
            {/* enfeite: pontinhos à direita, sumindo pra esquerda */}
            <span
                aria-hidden
                className="pontilhado pointer-events-none absolute inset-y-0 right-0 w-3/5"
            />
            <div className="relative flex items-center justify-between gap-2">
                <p className="text-[14px] font-medium">{label}</p>
                <span
                    title={info}
                    aria-label={info}
                    className="text-text-muted -mr-1 flex h-6 w-6 items-center justify-center"
                >
                    <Info size={15} strokeWidth={2} aria-hidden />
                </span>
            </div>
            <div className="relative mt-2.5 flex items-center gap-3">
                <p className="text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
                    {value}
                </p>
                {badge}
            </div>
            <div className="text-text-secondary relative mt-auto pt-3 text-[12px] leading-snug">
                {footer}
            </div>
        </Card>
    );
}
