import { useState } from "react";

import { Card } from "@/components/cards/Card";
import { DataTable } from "@/components/charts/DataTable";
import { useChartTheme } from "@/hooks/useChartTheme";
import {
    COMPONENTES,
    contribuicao,
    notaDe,
    potencial,
    type Componente,
} from "@/lib/cpc";
import { formatDecimal } from "@/lib/format";
import type { AvaliacaoCurso } from "@/lib/qualidade";
import { cn } from "@/lib/utils";

const MAIOR_POTENCIAL = Math.max(...COMPONENTES.map(potencial));

interface Linha {
    componente: Componente;
    nota: number;
    ganho: number;
    maximo: number;
}

/** De onde vem o CPC: cada componente traz nota × peso pontos, de no máximo
 * 5 × peso. A trilha cinza é o máximo (o comprimento já mostra o peso) e o
 * preenchimento é o que o curso conseguiu; ordenado do maior peso pro menor
 * (no mesmo peso, pelo que mais deixou de ganhar). A soma das contribuições
 * é o CPC. */
export function ContribuicaoCard({
    curso,
    className,
}: {
    curso: AvaliacaoCurso;
    className?: string;
}) {
    const CHART = useChartTheme();
    const [hover, setHover] = useState<string | null>(null);

    const linhas: Linha[] = COMPONENTES.flatMap((c) => {
        const nota = notaDe(curso.perfil, c.key);
        return nota === null
            ? []
            : [
                  {
                      componente: c,
                      nota,
                      ganho: contribuicao(nota, c),
                      maximo: potencial(c),
                  },
              ];
    })
        // do maior peso pro menor; no mesmo peso, o que mais deixou de ganhar
        .sort(
            (a, b) =>
                b.componente.peso - a.componente.peso ||
                b.maximo - b.ganho - (a.maximo - a.ganho)
        );
    const semNota = COMPONENTES.length - linhas.length;
    const soma = linhas.reduce((t, l) => t + l.ganho, 0);
    const ativa = linhas.find((l) => l.componente.key === hover);

    return (
        <Card
            title="De onde vem a nota"
            subtitle="Pontos de CPC que cada componente trouxe (nota × peso), do máximo possível"
            className={className}
        >
            <div className="mt-3 flex min-h-[26px] items-center gap-3">
                <p className="text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
                    {formatDecimal(ativa ? ativa.ganho : soma)}
                </p>
                <p className="text-text-secondary min-w-0 truncate text-[13px]">
                    {ativa ? (
                        <>
                            <span className="text-ink font-semibold">
                                {ativa.componente.nome}
                            </span>
                            {` | nota ${formatDecimal(ativa.nota)} × peso ${(ativa.componente.peso * 100).toLocaleString("pt-BR")}% · deixou de ganhar ${formatDecimal(ativa.maximo - ativa.ganho)}`}
                        </>
                    ) : (
                        <>
                            <span className="text-ink font-semibold">
                                Soma das contribuições
                            </span>
                            {curso.cpc !== null &&
                                ` | CPC do curso ${formatDecimal(curso.cpc)}`}
                        </>
                    )}
                </p>
            </div>

            <ul
                className="mt-4 flex flex-col gap-1"
                onMouseLeave={() => setHover(null)}
            >
                {linhas.map((l) => (
                    <li
                        key={l.componente.key}
                        onMouseEnter={() => setHover(l.componente.key)}
                        className={cn(
                            "grid grid-cols-[minmax(0,1fr)_76px] items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-2 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)_84px]",
                            hover === l.componente.key && "bg-page"
                        )}
                    >
                        <span
                            className="col-span-2 flex min-w-0 items-baseline gap-1.5 text-[12px] sm:col-span-1"
                            title={l.componente.nome}
                        >
                            <span className="truncate font-medium">
                                {l.componente.nome}
                            </span>
                            <span className="text-text-muted shrink-0 text-[11px] tabular-nums">
                                {(l.componente.peso * 100).toLocaleString("pt-BR")}%
                            </span>
                        </span>
                        <span className="relative h-3">
                            <span
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                    width: `${(l.maximo / MAIOR_POTENCIAL) * 100}%`,
                                    background: CHART.deemphasis,
                                }}
                            >
                                <span
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    style={{
                                        width: `${(l.ganho / l.maximo) * 100}%`,
                                        background: CHART.brand,
                                    }}
                                />
                            </span>
                        </span>
                        <span className="text-right text-[12px] tabular-nums">
                            <span className="font-semibold">
                                {formatDecimal(l.ganho)}
                            </span>
                            <span className="text-text-muted">
                                {" "}
                                de {formatDecimal(l.maximo)}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>

            <div className="text-text-muted mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                    <span aria-hidden className="bg-brand h-2 w-4 rounded-full" />
                    pontos conquistados
                </span>
                <span className="flex items-center gap-1.5">
                    <span
                        aria-hidden
                        className="h-2 w-4 rounded-full"
                        style={{ background: CHART.deemphasis }}
                    />
                    máximo possível (nota 5)
                </span>
                {semNota > 0 && (
                    <span>
                        {semNota} {semNota === 1 ? "componente" : "componentes"} sem
                        nota nesta edição
                    </span>
                )}
            </div>

            <div className="sr-only">
                <DataTable
                    columns={["Componente", "Nota", "Peso", "Pontos", "Máximo"]}
                    rows={linhas.map((l) => [
                        l.componente.nome,
                        formatDecimal(l.nota),
                        `${(l.componente.peso * 100).toLocaleString("pt-BR")}%`,
                        formatDecimal(l.ganho),
                        formatDecimal(l.maximo),
                    ])}
                />
            </div>
        </Card>
    );
}
