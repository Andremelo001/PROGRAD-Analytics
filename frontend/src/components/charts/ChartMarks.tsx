// Marcas compartilhadas dos gráficos de linha no estilo do design de
// referência: ano em foco numa pílula limão no eixo X e anel + etiqueta escura
// no ponto em foco.
import { useChartTheme } from "@/hooks/useChartTheme";

/** Ano no eixo X; o ano em foco vai numa pílula limão. */
export function YearTick({
    visible,
    x,
    y,
    ano,
    active,
}: {
    x: number;
    y: number;
    ano: number;
    active: boolean;
    visible: boolean;
}) {
    const CHART = useChartTheme();
    if (!visible) return <g />;
    return (
        <g transform={`translate(${x},${y + 4})`}>
            {active && (
                <rect x={-23} y={0} width={46} height={26} rx={8} fill={CHART.lime} />
            )}
            <text
                x={0}
                y={17}
                textAnchor="middle"
                fontSize={11.5}
                fontWeight={active ? 700 : 400}
                fill={active ? CHART.onLime : CHART.textMuted}
            >
                {ano}
            </text>
        </g>
    );
}

/** Anel no ponto em foco (cor ``ring``) + etiqueta escura opcional com o
 * valor logo acima. */
export function FocusMarker({
    cx,
    cy,
    label,
    ring,
}: {
    cx: number;
    cy: number;
    label?: string;
    ring?: string;
}) {
    const CHART = useChartTheme();
    const w = (label?.length ?? 0) * 7.5 + 24;
    return (
        <g>
            {label && (
                <>
                    <rect
                        x={cx - w / 2}
                        y={cy - 42}
                        width={w}
                        height={26}
                        rx={7}
                        fill={CHART.label}
                    />
                    <text
                        x={cx}
                        y={cy - 24.5}
                        textAnchor="middle"
                        fontSize={11.5}
                        fontWeight={600}
                        fill={CHART.labelText}
                    >
                        {label}
                    </text>
                </>
            )}
            <circle
                cx={cx}
                cy={cy}
                r={6.5}
                fill={CHART.surface}
                stroke={ring ?? CHART.lime}
                strokeWidth={4}
            />
        </g>
    );
}
