import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Card } from "@/components/cards/Card";
import { formatPercent, formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Stat tile (dataviz): rótulo · valor · delta vs. a média nacional.
 *
 * ``higherIsBetter`` decide a cor do delta: conclusão acima da média é bom,
 * evasão acima da média é ruim. A cor nunca vai sozinha — seta + texto
 * ("abaixo/acima da média nacional") carregam o significado. */
export function StatTile({
    label,
    caption,
    value,
    nationalValue,
    higherIsBetter,
    className,
}: {
    label: string;
    caption: string;
    value: number | null;
    nationalValue: number | null;
    higherIsBetter: boolean;
    className?: string;
}) {
    return (
        <Card className={className}>
            <p className="text-[15px] leading-tight font-bold">{label}</p>
            <p className="text-text-secondary text-[13px] leading-snug">{caption}</p>
            <p className="mt-auto pt-2 text-[32px] leading-none font-bold">
                {value === null ? "—" : formatPercent(value)}
            </p>
            {value !== null && nationalValue !== null && (
                <Delta
                    value={value}
                    nationalValue={nationalValue}
                    higherIsBetter={higherIsBetter}
                />
            )}
        </Card>
    );
}

function Delta({
    value,
    nationalValue,
    higherIsBetter,
}: {
    value: number;
    nationalValue: number;
    higherIsBetter: boolean;
}) {
    const diff = value - nationalValue;
    const same = Math.abs(diff) < 0.05;
    const above = diff > 0;
    const good = !same && above === higherIsBetter;
    const Icon = same ? Minus : above ? ArrowUp : ArrowDown;
    const text = same
        ? "igual à média nacional"
        : `${formatPoints(diff)} ${above ? "acima" : "abaixo"} da média nacional`;

    return (
        <p
            className={cn(
                "mt-1.5 flex items-start gap-1 text-[13px] leading-snug",
                same
                    ? "text-text-secondary"
                    : good
                      ? "text-status-good-text"
                      : "text-status-critical"
            )}
        >
            <Icon
                size={14}
                strokeWidth={2.25}
                className="mt-0.5 shrink-0"
                aria-hidden
            />
            <span>
                {text}{" "}
                <span className="text-text-secondary">
                    ({formatPercent(nationalValue)})
                </span>
            </span>
        </p>
    );
}
