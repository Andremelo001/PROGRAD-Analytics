import { useState } from "react";
import {
    Bar,
    BarChart,
    Cell,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from "recharts";

import { Card } from "@/components/cards/Card";
import { CHART } from "@/components/charts/chart-theme";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { DataTable, ViewToggle } from "@/components/charts/ViewToggle";
import { formatDate, formatPercent } from "@/lib/format";
import type {
    DistribuicaoCpcFaixaItem,
    DistribuicaoCpcFaixaNacionalItem,
} from "@/types/dashboard";

const FAIXAS = ["1", "2", "3", "4", "5"] as const;
const SEM_CPC = "Sem CPC";

interface Row {
    label: string;
    value: number;
    color: string;
}

function buildRows(dist: DistribuicaoCpcFaixaItem[], totalCursos: number): Row[] {
    const counts = new Map(dist.map((d) => [d.cpc_faixa, d.quantidade_cursos]));
    const withFaixa = FAIXAS.reduce((sum, f) => sum + (counts.get(f) ?? 0), 0);
    // "SC" (sem conceito) + cursos que nem aparecem na avaliação
    const semCpc = Math.max(totalCursos - withFaixa, 0);
    return [
        ...FAIXAS.map((f) => ({
            label: `Faixa ${f}`,
            value: counts.get(f) ?? 0,
            color: CHART.brand,
        })),
        { label: SEM_CPC, value: semCpc, color: CHART.deemphasis },
    ];
}

/** % dos cursos avaliados (faixas 1-5) que estão em 4 ou 5 — sem contar "SC". */
function shareTop(values: Map<string, number>): number | null {
    const evaluated = FAIXAS.reduce((sum, f) => sum + (values.get(f) ?? 0), 0);
    if (evaluated === 0) return null;
    return (((values.get("4") ?? 0) + (values.get("5") ?? 0)) / evaluated) * 100;
}

/** Cursos do campus por faixa de CPC (``campus.distribuicao_cpc_faixa``) —
 * série única, faixas ordenadas; comparação com o grupo de pares nacional em
 * texto (contagem x percentual não dividem eixo). */
export function CpcFaixaCard({
    dist,
    distNacional,
    totalCursos,
    atualizadoEm,
    className,
}: {
    dist: DistribuicaoCpcFaixaItem[];
    distNacional: DistribuicaoCpcFaixaNacionalItem[];
    totalCursos: number;
    atualizadoEm: string | null;
    className?: string;
}) {
    const [showTable, setShowTable] = useState(false);
    const rows = buildRows(dist, totalCursos);
    const evaluated = rows.slice(0, 5).reduce((sum, r) => sum + r.value, 0);
    const top = rows[3].value + rows[4].value;
    const campusShare = shareTop(
        new Map(dist.map((d) => [d.cpc_faixa, d.quantidade_cursos]))
    );
    const nationalShare = shareTop(
        new Map(distNacional.map((d) => [d.cpc_faixa, d.percentual_nacional]))
    );

    return (
        <Card
            title="Cursos por faixa de CPC"
            subtitle="Avaliação mais recente de cada curso"
            action={
                <ViewToggle
                    showTable={showTable}
                    onToggle={() => setShowTable((v) => !v)}
                />
            }
            className={className}
        >
            {showTable ? (
                <DataTable
                    columns={["Faixa", "Cursos"]}
                    rows={rows.map((r) => [r.label, String(r.value)])}
                />
            ) : (
                <div className="mt-3 min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={rows}
                            margin={{ top: 20, right: 4, bottom: 0, left: 4 }}
                        >
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={{ stroke: CHART.axis }}
                                tick={{
                                    fill: CHART.textMuted,
                                    fontSize: CHART.tickFont,
                                }}
                                tickMargin={6}
                                interval={0}
                            />
                            <Tooltip
                                cursor={{ fill: "rgba(1, 107, 174, 0.06)" }}
                                content={({ active, payload }) => {
                                    const row = payload?.[0]?.payload as
                                        Row | undefined;
                                    return active && row ? (
                                        <ChartTooltip
                                            title={row.label}
                                            value={`${row.value} ${row.value === 1 ? "curso" : "cursos"}`}
                                            color={row.color}
                                        />
                                    ) : null;
                                }}
                            />
                            <Bar
                                dataKey="value"
                                maxBarSize={22}
                                radius={[4, 4, 0, 0]}
                                isAnimationActive={false}
                            >
                                {rows.map((row) => (
                                    <Cell key={row.label} fill={row.color} />
                                ))}
                                <LabelList
                                    dataKey="value"
                                    position="top"
                                    offset={6}
                                    fill="#1e1e1e"
                                    fontSize={13}
                                    fontWeight={700}
                                    formatter={(v: unknown) =>
                                        Number(v) > 0 ? String(v) : ""
                                    }
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            {campusShare !== null && (
                <p className="text-text-secondary mt-2 text-[13px] leading-snug">
                    <span className="text-ink font-bold">
                        {top} de {evaluated}
                    </span>{" "}
                    cursos avaliados nas faixas 4 ou 5 ({formatPercent(campusShare, 0)})
                    {nationalShare !== null &&
                        ` — no Brasil, nas mesmas áreas: ${formatPercent(nationalShare, 0)}`}
                    .
                </p>
            )}
            <p className="text-text-muted mt-1 text-xs">
                Fonte: INEP, Indicadores de Qualidade (CPC)
                {atualizadoEm && ` · atualizado em ${formatDate(atualizadoEm)}`}
            </p>
        </Card>
    );
}
