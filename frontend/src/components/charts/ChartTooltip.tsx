/** Caixa de tooltip (dataviz): o valor é o elemento forte, o rótulo vem em
 * tinta secundária; a série é identificada por um traço curto da sua cor. */
export function ChartTooltip({
    title,
    value,
    color,
}: {
    title: string;
    value: string;
    color: string;
}) {
    return (
        <div className="text-ink rounded-md border border-black/10 bg-white px-3 py-2 shadow-md">
            <p className="text-text-secondary text-xs leading-tight">{title}</p>
            <p className="mt-0.5 flex items-center gap-2 text-base leading-tight font-bold">
                <span
                    aria-hidden
                    className="h-0.5 w-3 rounded"
                    style={{ background: color }}
                />
                {value}
            </p>
        </div>
    );
}

/** Variante com várias séries (ex.: curso x média nacional): um título e uma
 * linha por série, cada uma com o traço da sua cor (tracejado se a série
 * for tracejada no gráfico). */
export function ChartTooltipMulti({
    title,
    items,
}: {
    title: string;
    items: { label: string; value: string; color: string; dashed?: boolean }[];
}) {
    return (
        <div className="text-ink rounded-md border border-black/10 bg-white px-3 py-2 shadow-md">
            <p className="text-text-secondary text-xs leading-tight">{title}</p>
            {items.map((item) => (
                <p
                    key={item.label}
                    className="mt-1 flex items-center gap-2 text-sm leading-tight"
                >
                    <SeriesSwatch color={item.color} dashed={item.dashed} />
                    <span className="text-text-secondary">{item.label}</span>
                    <span className="ml-auto pl-3 font-bold">{item.value}</span>
                </p>
            ))}
        </div>
    );
}

/** Traço curto que identifica a série — mesmo desenho da linha no gráfico. */
export function SeriesSwatch({ color, dashed }: { color: string; dashed?: boolean }) {
    return (
        <svg aria-hidden width="14" height="4" className="shrink-0">
            <line
                x1="0"
                y1="2"
                x2="14"
                y2="2"
                stroke={color}
                strokeWidth="2"
                strokeDasharray={dashed ? "3 2" : undefined}
            />
        </svg>
    );
}
