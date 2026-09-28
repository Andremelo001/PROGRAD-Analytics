// Marcas compartilhadas dos gráficos de linha no estilo do design de
// referência: ano em foco numa pílula limão no eixo X e anel + etiqueta escura
// no ponto em foco.
import { CHART } from "@/components/charts/chart-theme";

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
                fill={active ? CHART.ink : CHART.textMuted}
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
    ring = CHART.lime,
}: {
    cx: number;
    cy: number;
    label?: string;
    ring?: string;
}) {
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
                        fill={CHART.ink}
                    />
                    <text
                        x={cx}
                        y={cy - 24.5}
                        textAnchor="middle"
                        fontSize={11.5}
                        fontWeight={600}
                        fill="#ffffff"
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
                stroke={ring}
                strokeWidth={4}
            />
        </g>
    );
}
