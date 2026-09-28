import { useMemo, useState } from "react";
import {
    Line,
    LineChart,
    ReferenceDot,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Card } from "@/components/cards/Card";
import { FocusMarker, YearTick } from "@/components/charts/ChartMarks";
import { ChartSelect } from "@/components/charts/ChartSelect";
import { CHART } from "@/components/charts/chart-theme";
import { DataTable } from "@/components/charts/DataTable";
import { formatInteger, toTitleCase } from "@/lib/format";
import type {
    Curso,
    DemandaIngressantesPonto,
    TendenciaIngressantesPonto,
} from "@/types/dashboard";

const CAMPUS = "campus";

interface Point {
    ano: number;
    valor: number;
}

interface Row extends Point {
    ativo: number | null;
    resto: number | null;
}

/** Série escolhida: o total do campus (``campus.tendencia_ingressantes``)
 * ou um curso (``trajetoria_comparada.demanda_ingressantes``). */
function buildSeries(
    escolha: string,
    tendencia: TendenciaIngressantesPonto[],
    demanda: DemandaIngressantesPonto[]
): Point[] {
    const pontos =
        escolha === CAMPUS
            ? tendencia.map((p) => ({ ano: p.ano_ingresso, valor: p.qt_ingressante }))
            : demanda
                  .filter((p) => String(p.codigo_curso) === escolha)
                  .map((p) => ({ ano: p.ano_ingresso, valor: p.qt_ingressante }));
    return pontos.sort((a, b) => a.ano - b.ano);
}

/** Eixo Y com passos "redondos" (1/2/2,5/5 x 10^n) e 5 marcas a partir do
 * zero ou de um piso abaixo do mínimo. */
function buildTicks(values: number[]): number[] {
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const raw = Math.max(max - min, 1) / 3;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
    const lo = Math.max(0, Math.floor(min / step) * step - step);
    const count = Math.ceil((max - lo) / step) + 1;
    return Array.from({ length: count }, (_, i) => lo + i * step);
}

/** Ingressantes por ano: a linha oliva vai até o ano em foco e o resto da
 * série segue em cinza; o ano em foco ganha uma etiqueta escura fixa e uma
 * pílula limão no eixo. Passar o mouse muda o foco (ao sair, volta pro
 * último ano). */
export function IngressantesTrendCard({
    tendencia,
    demanda,
    cursos,
    className,
}: {
    tendencia: TendenciaIngressantesPonto[];
    demanda: DemandaIngressantesPonto[];
    cursos: Curso[];
    className?: string;
}) {
    const [escolha, setEscolha] = useState(CAMPUS);
    const [hover, setHover] = useState<number | null>(null);
    const [width, setWidth] = useState(0);

    const serie = useMemo(
        () => buildSeries(escolha, tendencia, demanda),
        [escolha, tendencia, demanda]
    );
    const sel = hover !== null && hover < serie.length ? hover : serie.length - 1;
    const rows: Row[] = serie.map((p, i) => ({
        ...p,
        ativo: i <= sel ? p.valor : null,
        resto: i >= sel ? p.valor : null,
    }));
    const foco = serie.at(sel);
    // cada ano precisa de ~52px: em telas estreitas mostra um a cada ``step``,
    // contando a partir do último, e sempre o ano em foco (sem vizinhos colados)
    const step =
        width > 0
            ? Math.max(1, Math.ceil((52 * serie.length) / Math.max(width - 60, 1)))
            : 1;
    const showTick = (i: number) =>
        i === sel || ((serie.length - 1 - i) % step === 0 && Math.abs(i - sel) >= step);
    const ticks = serie.length > 0 ? buildTicks(serie.map((p) => p.valor)) : [0, 1];
    const nome =
        escolha === CAMPUS
            ? "Total do campus, por ano de ingresso"
            : `${toTitleCase(
                  cursos.find((c) => String(c.codigo_curso) === escolha)?.nome_curso ??
                      ""
              )}, por ano de ingresso`;

    return (
        <Card
            title="Ingressantes"
            subtitle={nome}
            action={
                <ChartSelect
                    label="Série exibida"
                    value={escolha}
                    options={[
                        { value: CAMPUS, label: "Campus" },
                        ...cursos.map((c) => ({
                            value: String(c.codigo_curso),
                            label: toTitleCase(c.nome_curso),
                        })),
                    ]}
                    onChange={(value) => {
                        setEscolha(value);
                        setHover(null);
                    }}
                />
            }
            className={className}
        >
            {/* só gráfico na tela; os valores seguem legíveis por leitor de tela */}
            <div className="sr-only">
                <DataTable
                    columns={["Ano de ingresso", "Ingressantes"]}
                    rows={serie.map((p) => [String(p.ano), formatInteger(p.valor)])}
                />
            </div>
            {serie.length === 0 ? (
                <p className="text-text-secondary mt-6 text-[13px]">
                    Sem dado de ingressantes para esta série.
                </p>
            ) : (
                <div className="mt-2 min-h-[240px] flex-1">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                        onResize={(w) => setWidth(w)}
                    >
                        <LineChart
                            data={rows}
                            margin={{ top: 48, right: 8, bottom: 0, left: 0 }}
                            onMouseMove={(state) => {
                                const index = state?.activeTooltipIndex;
                                if (index !== undefined && index !== null) {
                                    setHover(Number(index));
                                }
                            }}
                            onMouseLeave={() => setHover(null)}
                        >
                            <XAxis
                                dataKey="ano"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                height={40}
                                padding={{ left: 20, right: 20 }}
                                tick={(props) => (
                                    <YearTick
                                        visible={showTick(Number(props.index))}
                                        x={Number(props.x)}
                                        y={Number(props.y)}
                                        ano={Number(props.payload?.value)}
                                        active={
                                            Number(props.payload?.value) === foco?.ano
                                        }
                                    />
                                )}
                            />
                            <YAxis
                                domain={[ticks[0], ticks.at(-1)!]}
                                ticks={ticks}
                                tickLine={false}
                                axisLine={false}
                                tick={{
                                    fill: CHART.textMuted,
                                    fontSize: CHART.tickFont,
                                }}
                                tickFormatter={(v: number) => formatInteger(v)}
                                width={40}
                            />
                            {/* invisível: só faz o gráfico reportar o índice sob o mouse */}
                            <Tooltip content={() => null} cursor={false} />
                            {foco && (
                                <ReferenceLine
                                    segment={[
                                        { x: foco.ano, y: foco.valor },
                                        { x: foco.ano, y: ticks[0] },
                                    ]}
                                    stroke={CHART.textMuted}
                                    strokeDasharray="3 4"
                                />
                            )}
                            <Line
                                type="monotone"
                                dataKey="resto"
                                stroke={CHART.deemphasis}
                                strokeWidth={2.5}
                                strokeLinecap="round"
                                dot={false}
                                activeDot={false}
                                isAnimationActive={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="ativo"
                                stroke={CHART.brand}
                                strokeWidth={2.5}
                                strokeLinecap="round"
                                dot={false}
                                activeDot={false}
                                isAnimationActive={false}
                            />
                            {foco && (
                                <ReferenceDot
                                    x={foco.ano}
                                    y={foco.valor}
                                    shape={(props: { cx?: number; cy?: number }) => (
                                        <FocusMarker
                                            cx={props.cx ?? 0}
                                            cy={props.cy ?? 0}
                                            label={formatInteger(foco.valor)}
                                        />
                                    )}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
}
