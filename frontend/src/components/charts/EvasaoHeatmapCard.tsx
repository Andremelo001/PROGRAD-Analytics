import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";

import { Card } from "@/components/cards/Card";
import { rampColor } from "@/components/charts/chart-theme";
import { DataTable } from "@/components/charts/DataTable";
import { formatPercent, formatPoints, toTitleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
    Curso,
    HeatmapEvasaoAnualCelula,
    HeatmapEvasaoNacionalCelula,
} from "@/types/dashboard";
import { useChartTheme } from "@/hooks/useChartTheme";

interface Celula {
    taxa: number | null;
    nacional: number | null;
}

interface Linha {
    codigo: number;
    nome: string;
    celulas: Map<number, Celula>;
}

function buildLinhas(
    cursos: Curso[],
    local: HeatmapEvasaoAnualCelula[],
    nacional: HeatmapEvasaoNacionalCelula[]
): { anos: number[]; linhas: Linha[] } {
    const media = new Map(
        nacional.map((n) => [
            `${n.nome_cine_area_geral}|${n.ano_referencia}`,
            n.taxa_desistencia_anual_media_nacional,
        ])
    );
    const anos = [...new Set(local.map((c) => c.ano_referencia))].sort((a, b) => a - b);
    const linhas = cursos
        .map((curso) => {
            const celulas = new Map<number, Celula>();
            for (const c of local) {
                if (c.codigo_curso !== curso.codigo_curso) continue;
                celulas.set(c.ano_referencia, {
                    taxa: c.taxa_desistencia_anual,
                    nacional:
                        media.get(`${c.nome_cine_area_geral}|${c.ano_referencia}`) ??
                        null,
                });
            }
            return {
                codigo: curso.codigo_curso,
                nome: toTitleCase(curso.nome_curso),
                celulas,
            };
        })
        .filter((l) => l.celulas.size > 0);
    return { anos, linhas };
}

const mean = (values: number[]) =>
    values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;

/** Evasão anual por curso e ano (``trajetoria_comparada.heatmap_evasao_anual``)
 * num mapa de calor: linhas = cursos, colunas = anos, cor = % dos alunos que
 * desistiram no ano (escala de um tom, vermelho claro → escuro). O número do
 * topo segue o mouse: a célula sob ele (curso, ano, taxa e diferença para a
 * média nacional da área no mesmo ano — ``medias_nacionais.heatmap_evasao_anual``)
 * ou, sem mouse, a média dos cursos no ano mais recente. */
export function EvasaoHeatmapCard({
    cursos,
    local,
    nacional,
    className,
}: {
    cursos: Curso[];
    local: HeatmapEvasaoAnualCelula[];
    nacional: HeatmapEvasaoNacionalCelula[];
    className?: string;
}) {
    const CHART = useChartTheme();
    const [hover, setHover] = useState<{ codigo: number; ano: number } | null>(null);
    const { anos, linhas } = useMemo(
        () => buildLinhas(cursos, local, nacional),
        [cursos, local, nacional]
    );
    const taxaMax = Math.max(
        5,
        Math.ceil(Math.max(...local.map((c) => c.taxa_desistencia_anual ?? 0)) / 5) * 5
    );

    // destaque do topo: a célula sob o mouse ou a média do ano mais recente
    const ultimo = anos.at(-1);
    const hoverLinha = hover
        ? linhas.find((l) => l.codigo === hover.codigo)
        : undefined;
    const hoverCelula = hover ? hoverLinha?.celulas.get(hover.ano) : undefined;
    const doUltimo = linhas
        .map((l) => (ultimo === undefined ? undefined : l.celulas.get(ultimo)))
        .filter((c): c is Celula => c !== undefined);
    const destaque =
        hover && hoverLinha
            ? {
                  taxa: hoverCelula?.taxa ?? null,
                  nacional: hoverCelula?.nacional ?? null,
                  contexto: `${hoverLinha.nome} · ${hover.ano}`,
              }
            : {
                  taxa: mean(
                      doUltimo.flatMap((c) => (c.taxa === null ? [] : [c.taxa]))
                  ),
                  nacional: mean(
                      doUltimo.flatMap((c) => (c.nacional === null ? [] : [c.nacional]))
                  ),
                  contexto: `Média dos cursos em ${ultimo}`,
              };
    const diff =
        destaque.taxa !== null && destaque.nacional !== null
            ? destaque.taxa - destaque.nacional
            : null;

    return (
        <Card
            title="Evasão anual por curso"
            subtitle="% dos alunos de cada curso que desistiram em cada ano"
            className={className}
        >
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 sm:flex-nowrap">
                <div className="flex min-w-0 basis-full items-center gap-3 sm:flex-1 sm:basis-auto">
                    {destaque.taxa === null ? (
                        // traço desenhado (não o caractere "—", que num corpo de
                        // 26px fica abaixo do centro da linha do texto ao lado),
                        // na mesma altura do número pra linha não mudar
                        <span
                            role="img"
                            aria-label="sem dado"
                            className="flex h-[26px] shrink-0 items-center"
                        >
                            <span className="bg-ink block h-[3px] w-6 rounded-full" />
                        </span>
                    ) : (
                        <p className="text-[26px] leading-none font-semibold tracking-[-0.02em]">
                            {formatPercent(destaque.taxa)}
                        </p>
                    )}
                    {diff !== null && <DiffBadge diff={diff} />}
                    <p className="text-text-secondary min-w-0 truncate text-[13px]">
                        {destaque.taxa === null ? (
                            <>{destaque.contexto} | sem turmas</>
                        ) : (
                            <>
                                <span className="text-ink font-semibold">
                                    {destaque.contexto}
                                </span>
                                {destaque.nacional !== null &&
                                    ` | média nacional ${formatPercent(destaque.nacional)}`}
                            </>
                        )}
                    </p>
                </div>
                <ScaleLegend taxaMax={taxaMax} />
            </div>

            <div className="relative mt-4" onMouseLeave={() => setHover(null)}>
                {/* folga de 4px em volta (compensada na margem): um container com
                    rolagem horizontal também corta na vertical, e o contorno da
                    célula sob o mouse passa 3px pra fora da grade */}
                <div className="-m-1 [scrollbar-width:none] overflow-x-auto p-1">
                    <div
                        // coluna dos nomes: 112px no celular (a grade rola dentro
                        // do card), até 200px a partir de sm
                        className="grid min-w-[660px] grid-cols-[112px_repeat(var(--anos),minmax(0,1fr))] items-center gap-[3px] sm:grid-cols-[minmax(112px,200px)_repeat(var(--anos),minmax(0,1fr))]"
                        style={{ "--anos": anos.length } as CSSProperties}
                        role="img"
                        aria-label={`Mapa de calor da evasão anual de ${linhas.length} cursos, de ${anos[0]} a ${ultimo}.`}
                    >
                        {linhas.map((linha) => (
                            <Row
                                key={linha.codigo}
                                linha={linha}
                                anos={anos}
                                ativo={hover?.codigo === linha.codigo}
                                hoverAno={
                                    hover?.codigo === linha.codigo ? hover.ano : null
                                }
                                colorOf={(c) =>
                                    c?.taxa == null
                                        ? null
                                        : rampColor(CHART.evasao, c.taxa / taxaMax)
                                }
                                onHover={(ano) =>
                                    setHover({ codigo: linha.codigo, ano })
                                }
                            />
                        ))}
                        <span className="bg-surface sticky left-0 z-[1] self-stretch" />
                        {anos.map((ano) => (
                            <span key={ano} className="flex justify-center pt-[5px]">
                                <span
                                    className={cn(
                                        "rounded-md px-1.5 py-0.5 text-[11px] tabular-nums",
                                        hover?.ano === ano
                                            ? "bg-lime text-on-lime font-bold"
                                            : "text-text-muted"
                                    )}
                                >
                                    {ano}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="sr-only">
                <DataTable
                    columns={["Curso", ...anos.map(String)]}
                    rows={linhas.map((l) => [
                        l.nome,
                        ...anos.map((ano) => {
                            const c = l.celulas.get(ano);
                            return c?.taxa == null ? "—" : formatPercent(c.taxa);
                        }),
                    ])}
                />
            </div>
        </Card>
    );
}

function Row({
    linha,
    anos,
    ativo,
    hoverAno,
    colorOf,
    onHover,
}: {
    linha: Linha;
    anos: number[];
    ativo: boolean;
    hoverAno: number | null;
    colorOf: (c: Celula | undefined) => string | null;
    onHover: (ano: number) => void;
}) {
    return (
        <>
            <span
                className={cn(
                    "bg-surface sticky left-0 z-[1] truncate pr-3 text-[12px]",
                    ativo ? "text-ink font-semibold" : "text-text-secondary"
                )}
                title={linha.nome}
            >
                {linha.nome}
            </span>
            {anos.map((ano) => {
                const cor = colorOf(linha.celulas.get(ano));
                return (
                    <span
                        key={ano}
                        onMouseEnter={() => onHover(ano)}
                        className={cn(
                            "h-[25px] rounded-[5px]",
                            cor === null && "border-empty border border-dashed",
                            hoverAno === ano && "ring-ink ring-2 ring-offset-1"
                        )}
                        style={cor ? { background: cor } : undefined}
                    />
                );
            })}
        </>
    );
}

/** Barra da escala de cores + a marca de "sem turmas". */
function ScaleLegend({ taxaMax }: { taxaMax: number }) {
    const CHART = useChartTheme();
    return (
        <div className="text-text-muted flex shrink-0 items-center gap-2 text-[11px] whitespace-nowrap">
            <span>0%</span>
            <span
                aria-hidden
                className="block h-2.5 w-24 rounded-full sm:w-36"
                style={{
                    background: `linear-gradient(to right, ${CHART.evasao.join(", ")})`,
                }}
            />
            <span>{taxaMax}%</span>
            <span className="ml-1 flex items-center gap-1.5">
                <span
                    aria-hidden
                    className="border-empty h-2.5 w-2.5 rounded-[3px] border border-dashed"
                />
                sem turmas
            </span>
        </div>
    );
}

/** Evasão - média nacional: limão se perdeu menos alunos que a média (bom),
 * vermelha se perdeu mais. */
function DiffBadge({ diff }: { diff: number }) {
    const same = Math.abs(diff) < 0.05;
    const Icon = same ? Minus : diff > 0 ? ArrowUp : ArrowDown;
    return (
        <span
            className={cn(
                "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] leading-none font-semibold whitespace-nowrap",
                same
                    ? "bg-page text-text-secondary"
                    : diff < 0
                      ? "bg-lime text-on-lime"
                      : "bg-status-critical text-white"
            )}
        >
            {diff > 0 ? "+" : diff < 0 ? "−" : ""}
            {formatPoints(diff)}
            <Icon size={13} strokeWidth={2.5} aria-hidden />
        </span>
    );
}
