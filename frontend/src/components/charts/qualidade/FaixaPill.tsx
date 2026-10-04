import { useChartTheme } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";

/** Faixa do CPC (1-5) numa pílula da rampa azul ordinal — o número vai
 * escrito, a cor só reforça a ordem. ``null`` = sem conceito (SC): pílula
 * tracejada. */
export function FaixaPill({
    faixa,
    className,
}: {
    faixa: number | null;
    className?: string;
}) {
    const CHART = useChartTheme();
    if (faixa === null) {
        return (
            <span
                title="Sem conceito"
                className={cn(
                    "border-empty text-text-muted inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-dashed px-1.5 text-[11px] font-semibold",
                    className
                )}
            >
                SC
            </span>
        );
    }
    return (
        <span
            title={`Faixa ${faixa}`}
            className={cn(
                "inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[12px] font-bold tabular-nums",
                className
            )}
            style={{
                background: CHART.faixa.ramp[faixa - 1],
                color: CHART.faixa.fg[faixa - 1],
            }}
        >
            {faixa}
        </span>
    );
}
