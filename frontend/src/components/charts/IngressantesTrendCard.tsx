import { useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ReferenceDot,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Card } from "@/components/cards/Card";
import { CHART } from "@/components/charts/chart-theme";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { DataTable, ViewToggle } from "@/components/charts/ViewToggle";
import { formatDate, formatInteger } from "@/lib/format";
import type { TendenciaIngressantesPonto } from "@/types/dashboard";

/** Tendência de ingressantes do campus (``campus.tendencia_ingressantes``):
 * série única -> sem caixa de legenda; o título nomeia a série. */
export function IngressantesTrendCard({
    data,
    atualizadoEm,
    className,
}: {
    data: TendenciaIngressantesPonto[];
    atualizadoEm: string | null;
    className?: string;
}) {
    const [showTable, setShowTable] = useState(false);
    const last = data.at(-1);
    const first = data.at(0);

    return (
        <Card
            title="Ingressantes por ano"
            subtitle={
                first && last
                    ? `Total do campus, de ${first.ano_ingresso} a ${last.ano_ingresso}`
                    : "Total do campus"
            }
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
                    columns={["Ano de ingresso", "Ingressantes"]}
                    rows={data.map((p) => [
                        String(p.ano_ingresso),
                        formatInteger(p.qt_ingressante),
                    ])}
                />
            ) : (
                <div className="mt-3 min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 12, right: 40, bottom: 0, left: 0 }}
                        >
                            <CartesianGrid vertical={false} stroke={CHART.grid} />
                            <XAxis
                                dataKey="ano_ingresso"
                                tickLine={false}
                                axisLine={{ stroke: CHART.axis }}
                                tick={{
                                    fill: CHART.textMuted,
                                    fontSize: CHART.tickFont,
                                }}
                                tickMargin={6}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{
                                    fill: CHART.textMuted,
                                    fontSize: CHART.tickFont,
                                }}
                                tickFormatter={(v: number) => formatInteger(v)}
                                allowDecimals={false}
                                width={36}
                            />
                            <Tooltip
                                cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
                                content={({ active, payload, label }) =>
                                    active && payload?.length ? (
                                        <ChartTooltip
                                            title={`Ingressantes em ${label}`}
                                            value={formatInteger(
                                                Number(payload[0].value)
                                            )}
                                            color={CHART.brand}
                                        />
                                    ) : null
                                }
                            />
                            <Area
                                type="linear"
                                dataKey="qt_ingressante"
                                stroke={CHART.brand}
                                strokeWidth={2}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                fill={CHART.brand}
                                fillOpacity={0.1}
                                dot={false}
                                activeDot={{
                                    r: 5,
                                    fill: CHART.brand,
                                    stroke: CHART.surface,
                                    strokeWidth: 2,
                                }}
                                isAnimationActive={false}
                            />
                            {last && (
                                <ReferenceDot
                                    x={last.ano_ingresso}
                                    y={last.qt_ingressante}
                                    r={5}
                                    fill={CHART.brand}
                                    stroke={CHART.surface}
                                    strokeWidth={2}
                                    label={{
                                        value: formatInteger(last.qt_ingressante),
                                        position: "right",
                                        fill: "#1e1e1e",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        offset: 10,
                                    }}
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
            <p className="text-text-muted mt-2 text-xs">
                Fonte: INEP, Indicadores de Trajetória
                {atualizadoEm && ` · atualizado em ${formatDate(atualizadoEm)}`}
            </p>
        </Card>
    );
}
