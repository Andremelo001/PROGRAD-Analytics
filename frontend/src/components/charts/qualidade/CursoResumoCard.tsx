import type { ReactNode } from "react";

import { Card } from "@/components/cards/Card";
import { ChartSelect } from "@/components/charts/ChartSelect";
import { DeltaPill } from "@/components/charts/qualidade/DeltaPill";
import { FaixaPill } from "@/components/charts/qualidade/FaixaPill";
import { formatDecimal, formatInteger, toTitleCase } from "@/lib/format";
import type { AvaliacaoCurso } from "@/lib/qualidade";

/** Cabeçalho da sub-aba Por curso: seletor do curso e a ficha da avaliação
 * mais recente (ano, área, CPC + faixa, Enade e a média nacional). */
export function CursoResumoCard({
    curso,
    cursos,
    onChange,
    className,
}: {
    curso: AvaliacaoCurso;
    cursos: AvaliacaoCurso[];
    onChange: (codigo: number) => void;
    className?: string;
}) {
    const options = [...cursos]
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
        .map((c) => ({ value: String(c.codigo), label: c.nome }));

    return (
        <Card className={className}>
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                <div className="min-w-0 flex-1 basis-64">
                    <p className="text-text-muted text-[12px]">
                        {curso.area
                            ? `Área de avaliação: ${toTitleCase(curso.area)}`
                            : "Sem área de avaliação"}
                    </p>
                    <h2 className="mt-1 truncate text-[22px] leading-tight font-semibold tracking-[-0.02em]">
                        {curso.nome}
                    </h2>
                </div>
                <ChartSelect
                    label="Curso"
                    value={String(curso.codigo)}
                    options={options}
                    onChange={(v) => onChange(Number(v))}
                />
            </div>

            {/* itens distribuídos de ponta a ponta (o primeiro encosta na
                esquerda, o último na direita), cada valor alinhado à esquerda
                do rótulo; no celular, em duas colunas */}
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:justify-between">
                <Item label="Avaliado em">{curso.ano ?? "—"}</Item>
                <Item label="CPC contínuo">
                    <span className="flex items-center gap-2">
                        {curso.cpc === null ? "—" : formatDecimal(curso.cpc)}
                        {curso.ano !== null && <FaixaPill faixa={curso.faixa} />}
                    </span>
                </Item>
                <Item label="Média nacional da área">
                    <span className="flex items-center gap-2">
                        {curso.cpcNacional === null
                            ? "—"
                            : formatDecimal(curso.cpcNacional)}
                        {curso.cpc !== null && curso.cpcNacional !== null && (
                            <DeltaPill size="sm" diff={curso.cpc - curso.cpcNacional} />
                        )}
                    </span>
                    {curso.cursosNacional !== null && (
                        <span className="text-text-muted block text-[11px] font-normal">
                            {formatInteger(curso.cursosNacional)} cursos em {curso.ano}
                        </span>
                    )}
                </Item>
                <Item label="Conceito Enade">
                    {curso.enade === null ? "—" : formatDecimal(curso.enade)}
                </Item>
            </dl>
        </Card>
    );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="min-w-0">
            <dt className="text-text-muted text-[12px]">{label}</dt>
            <dd className="mt-1 text-[18px] leading-tight font-semibold tabular-nums">
                {children}
            </dd>
        </div>
    );
}
