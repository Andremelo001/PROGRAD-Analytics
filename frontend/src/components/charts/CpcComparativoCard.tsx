import { useMemo, useState } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Card } from "@/components/cards/Card";
import { CHART } from "@/components/charts/chart-theme";
import { ChartTooltipMulti, SeriesSwatch } from "@/components/charts/ChartTooltip";
import { DataTable, ViewToggle } from "@/components/charts/ViewToggle";
import { formatDate, formatDecimal, formatInteger, toTitleCase } from "@/lib/format";
import type { EvolucaoCpcNacionalPonto, EvolucaoCpcPonto } from "@/types/dashboard";

const CPC_TICKS = [0, 1, 2, 3, 4, 5];

interface Row {
    ano: number;
    curso: number | null;
    nacional: number | null;
    cursosConsiderados: number | null;
}

interface CursoOption {
    codigo: number;
    nome: string;
    area: string;
}

/** Cursos que têm CPC em algum ano, ordenados pelo nome. */
function buildOptions(evolucao: EvolucaoCpcPonto[]): CursoOption[] {
    const byCodigo = new Map<number, CursoOption>();
    for (const p of evolucao) {
        if (!byCodigo.has(p.codigo_curso)) {
            byCodigo.set(p.codigo_curso, {
                codigo: p.codigo_curso,
                nome: toTitleCase(p.nome_curso),
                area: p.area_avaliacao,
            });
        }
    }
    return [...byCodigo.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Junta, por ano, o CPC do curso com a média nacional da mesma área de
 * avaliação — a comparação é sempre com os cursos-pares, nunca com o Brasil
 * inteiro misturado. */
function buildRows(
    curso: CursoOption,
    evolucao: EvolucaoCpcPonto[],
    nacional: EvolucaoCpcNacionalPonto[]
): Row[] {
    const rows = new Map<number, Row>();
    const row = (ano: number) => {
        const existing = rows.get(ano);
        if (existing) return existing;
        const created: Row = {
            ano,
            curso: null,
            nacional: null,
            cursosConsiderados: null,
        };
        rows.set(ano, created);
        return created;
    };
    for (const p of evolucao) {
        if (p.codigo_curso === curso.codigo) row(p.ano).curso = p.cpc_continuo;
    }
    for (const p of nacional) {
        // só os anos em que o curso foi avaliado: o eixo é o do curso
        if (p.area_avaliacao === curso.area && rows.has(p.ano)) {
            const r = row(p.ano);
            r.nacional = p.cpc_continuo_medio_nacional;
            r.cursosConsiderados = p.quantidade_cursos_considerados;
        }
    }
    return [...rows.values()].sort((a, b) => a.ano - b.ano);
}

const fmt = (value: number | null) => (value === null ? "—" : formatDecimal(value));

/** CPC contínuo de um curso escolhido x média nacional da mesma área
 * (``curso_perfil.evolucao_cpc`` + ``medias_nacionais.evolucao_cpc``). */
export function CpcComparativoCard({
    evolucao,
    nacional,
    atualizadoEm,
    className,
}: {
    evolucao: EvolucaoCpcPonto[];
    nacional: EvolucaoCpcNacionalPonto[];
    atualizadoEm: string | null;
    className?: string;
}) {
    const options = useMemo(() => buildOptions(evolucao), [evolucao]);
    const [codigo, setCodigo] = useState<number | null>(options[0]?.codigo ?? null);
    const [showTable, setShowTable] = useState(false);

    const selected = options.find((o) => o.codigo === codigo) ?? options[0];
    const rows = useMemo(
        () => (selected ? buildRows(selected, evolucao, nacional) : []),
        [selected, evolucao, nacional]
    );
    const latest = [...rows].reverse().find((r) => r.curso !== null);

    return (
        <Card
            title="CPC: curso x média nacional"
            subtitle="Média dos cursos da mesma área de avaliação no Brasil"
            action={
                options.length > 0 && (
                    <ViewToggle
                        showTable={showTable}
                        onToggle={() => setShowTable((v) => !v)}
                    />
                )
            }
            className={className}
        >
            {!selected ? (
                <p className="text-text-secondary mt-3 text-[13px]">
                    Nenhum curso do campus com CPC avaliado.
                </p>
            ) : (
                <>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <select
                            aria-label="Curso para comparar"
                            value={selected.codigo}
                            onChange={(event) => setCodigo(Number(event.target.value))}
                            className="text-ink focus-visible:ring-brand/40 max-w-full min-w-0 rounded-full border border-black/10 bg-white px-2.5 py-0.5 text-[13px] outline-none focus-visible:ring-2"
                        >
                            {options.map((o) => (
                                <option key={o.codigo} value={o.codigo}>
                                    {o.nome}
                                </option>
                            ))}
                        </select>
                        <div className="text-text-secondary flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1.5">
                                <SeriesSwatch color={CHART.brand} />
                                Curso
                            </span>
                            <span className="flex items-center gap-1.5">
                                <SeriesSwatch color={CHART.deemphasis} dashed />
                                Média nacional
                            </span>
                        </div>
                    </div>

                    {showTable ? (
                        <DataTable
                            columns={["Ano", "Curso", "Média nacional"]}
                            rows={rows.map((r) => [
                                String(r.ano),
                                fmt(r.curso),
                                fmt(r.nacional),
                            ])}
                        />
                    ) : (
                        <div className="mt-2 min-h-0 flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={rows}
                                    margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        stroke={CHART.grid}
                                    />
                                    <XAxis
                                        dataKey="ano"
                                        type="category"
                                        tickLine={false}
                                        axisLine={{ stroke: CHART.axis }}
                                        tick={{
                                            fill: CHART.textMuted,
                                            fontSize: CHART.tickFont,
                                        }}
                                        tickMargin={6}
                                        padding={{ left: 24, right: 24 }}
                                    />
                                    <YAxis
                                        domain={[0, 5]}
                                        ticks={CPC_TICKS}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{
                                            fill: CHART.textMuted,
                                            fontSize: CHART.tickFont,
                                        }}
                                        width={24}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
                                        content={({ active, payload }) => {
                                            const r = payload?.[0]?.payload as
                                                Row | undefined;
                                            return active && r ? (
                                                <ChartTooltipMulti
                                                    title={`CPC em ${r.ano}`}
                                                    items={[
                                                        {
                                                            label: "Curso",
                                                            value: fmt(r.curso),
                                                            color: CHART.brand,
                                                        },
                                                        {
                                                            label: "Média nacional",
                                                            value: fmt(r.nacional),
                                                            color: CHART.deemphasis,
                                                            dashed: true,
                                                        },
                                                    ]}
                                                />
                                            ) : null;
                                        }}
                                    />
                                    <Line
                                        type="linear"
                                        dataKey="nacional"
                                        stroke={CHART.deemphasis}
                                        strokeWidth={2}
                                        strokeDasharray="5 4"
                                        dot={{
                                            r: 3.5,
                                            fill: CHART.deemphasis,
                                            strokeWidth: 0,
                                        }}
                                        activeDot={{
                                            r: 4.5,
                                            fill: CHART.deemphasis,
                                            strokeWidth: 0,
                                        }}
                                        connectNulls
                                        isAnimationActive={false}
                                    />
                                    {/* Curso por cima da média: é a série principal. */}
                                    <Line
                                        type="linear"
                                        dataKey="curso"
                                        stroke={CHART.brand}
                                        strokeWidth={2}
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                        dot={{
                                            r: 4,
                                            fill: CHART.brand,
                                            stroke: CHART.surface,
                                            strokeWidth: 2,
                                        }}
                                        activeDot={{
                                            r: 5,
                                            fill: CHART.brand,
                                            stroke: CHART.surface,
                                            strokeWidth: 2,
                                        }}
                                        connectNulls
                                        isAnimationActive={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {latest && (
                        <p className="text-text-secondary mt-2 text-[13px] leading-snug">
                            Em {latest.ano}:{" "}
                            <span className="text-ink font-bold">
                                {fmt(latest.curso)}
                            </span>{" "}
                            no curso
                            {latest.nacional !== null &&
                                ` · ${fmt(latest.nacional)} na média nacional`}
                            {latest.cursosConsiderados !== null &&
                                ` (${formatInteger(latest.cursosConsiderados)} cursos)`}
                            .
                        </p>
                    )}
                </>
            )}
            <p className="text-text-muted mt-1 text-xs">
                Fonte: INEP, Indicadores de Qualidade (CPC)
                {atualizadoEm && ` · atualizado em ${formatDate(atualizadoEm)}`}
            </p>
        </Card>
    );
}
