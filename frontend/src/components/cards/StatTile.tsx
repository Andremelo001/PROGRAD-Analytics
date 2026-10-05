import { ArrowDown, ArrowUp, Info, Minus } from "lucide-react";

import { Card } from "@/components/cards/Card";
import { formatPercent, formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useChartTheme } from "@/hooks/useChartTheme";

export interface StatTilePoint {
    ano: number;
    valor: number;
}

/** Stat tile compacto: rótulo · valor · pílula com a diferença para a média
 * nacional · frase de contexto, e uma sparkline no canto inferior direito
 * (a série histórica da mesma taxa).
 *
 * ``higherIsBetter`` decide o tom: conclusão acima da média é bom (limão),
 * evasão acima da média é ruim (vermelho). O tom nunca vai sozinho — seta e
 * texto carregam o significado. */
export function StatTile({
    label,
    info,
    value,
    nationalValue,
    higherIsBetter,
    serie,
    serieLabel,
    className,
}: {
    label: string;
    info: string;
    value: number | null;
    nationalValue: number | null;
    higherIsBetter: boolean;
    serie: StatTilePoint[];
    serieLabel: string;
    className?: string;
}) {
    const CHART = useChartTheme();
    const diff =
        value !== null && nationalValue !== null ? value - nationalValue : null;
    const same = diff !== null && Math.abs(diff) < 0.05;
    const above = diff !== null && diff > 0;
    const good = diff !== null && !same && above === higherIsBetter;
    const tone = diff === null || same ? "neutral" : good ? "good" : "bad";
    const Arrow = same ? Minus : above ? ArrowUp : ArrowDown;

    return (
        <Card className={cn("relative overflow-hidden", className)}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] font-medium">{label}</p>
                <span
                    title={info}
                    aria-label={info}
                    className="text-text-muted -mr-1 flex h-6 w-6 items-center justify-center"
                >
                    <Info size={15} strokeWidth={2} aria-hidden />
                </span>
            </div>

            <div className="mt-2.5 flex items-center gap-3">
                <p className="text-[26px] leading-none font-semibold tracking-[-0.02em]">
                    {value === null ? "—" : formatPercent(value)}
                </p>
                {diff !== null && (
                    <span
                        className={cn(
                            "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] leading-none font-semibold",
                            tone === "good" && "bg-good text-on-good",
                            tone === "bad" && "bg-status-critical text-white",
                            tone === "neutral" && "bg-page text-text-secondary"
                        )}
                    >
                        {formatPoints(diff)}
                        <Arrow size={13} strokeWidth={2.5} aria-hidden />
                    </span>
                )}
            </div>

            {diff !== null && nationalValue !== null && (
                <p className="relative z-[1] mt-3 max-w-[56%] text-[13px] leading-snug">
                    <span
                        className={cn(
                            "font-semibold",
                            tone === "good" && "text-olive-text",
                            tone === "bad" && "text-status-critical-text",
                            tone === "neutral" && "text-text-secondary"
                        )}
                    >
                        {same ? "=" : above ? "+" : "−"} {formatPoints(diff)}
                    </span>{" "}
                    {same ? "igual à" : above ? "acima da" : "abaixo da"} média nacional
                    ({formatPercent(nationalValue)})
                </p>
            )}

            <Sparkline
                serie={serie}
                label={serieLabel}
                color={tone === "bad" ? CHART.critical : CHART.brand}
            />
        </Card>
    );
}

/** Sparkline encostada no canto inferior direito do card (sai pela borda,
 * como no design): só a linha de 2px, sem área. Sem eixos: é contexto, não
 * leitura exata. */
function Sparkline({
    serie,
    label,
    color,
}: {
    serie: StatTilePoint[];
    label: string;
    color: string;
}) {
    if (serie.length < 2) return null;

    const W = 160;
    const H = 72;
    const values = serie.map((p) => p.valor);
    const min = Math.min(...values);
    const span = Math.max(...values) - min || 1;
    const points = serie.map((p, i) => ({
        x: (i / (serie.length - 1)) * W,
        y: 8 + (1 - (p.valor - min) / span) * (H - 16),
    }));
    const line = points.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
    const first = serie[0];
    const last = serie.at(-1)!;

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute right-0 bottom-0 h-[72px] w-[44%]"
            role="img"
            aria-label={`${label}: de ${formatPercent(first.valor)} em ${first.ano} a ${formatPercent(last.valor)} em ${last.ano}`}
        >
            <title>
                {serie.map((p) => `${p.ano}: ${formatPercent(p.valor)}`).join(" · ")}
            </title>
            <path
                d={line}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
