// Cores dos gráficos em hex (espelham os tokens de src/index.css): atributos de
// SVG (stroke/fill) não resolvem var(--...) de forma confiável. Uma paleta por
// tema, com as mesmas chaves — os componentes pegam a do tema atual com
// ``useChartTheme()`` (hooks/useChartTheme.ts).

export interface ChartPalette {
    brand: string; // série principal (oliva)
    lime: string; // realce do ponto/ano selecionado
    onLime: string; // texto sobre o limão
    critical: string; // série "ruim" (evasão)
    deemphasis: string; // trecho fora de foco / resto
    reference: string; // linha de referência (média nacional)
    ink: string; // marcas de contraste (pino do mapa)
    label: string; // etiqueta do ponto em foco
    labelText: string;
    textMuted: string; // rótulos de eixo
    surface: string; // cor do card (respiros e anéis)
    tickFont: number;
    /** Mapa de presença por UF: rampa ordinal (poucos → muitos cursos) e cinza
     * de "sem oferta". Validada com ``--ordinal`` contra o card do tema. */
    presenca: { ramp: readonly string[]; none: string };
    /** Mapa de calor da evasão anual: sequencial contínua de um tom, pouca →
     * muita evasão (a ponta "quase zero" pode fundir com o card). */
    evasao: readonly string[];
}

export const CHART_LIGHT: ChartPalette = {
    brand: "#a2b82e",
    lime: "#dcf366",
    onLime: "#1b1b1d",
    critical: "#e5484d",
    deemphasis: "#d9d9dd",
    reference: "#b4b5bc",
    ink: "#1b1b1d",
    label: "#1b1b1d",
    labelText: "#ffffff",
    textMuted: "#9a9ba3",
    surface: "#ffffff",
    tickFont: 11,
    presenca: {
        ramp: ["#a4c236", "#86a320", "#678015", "#4a5d0c"],
        none: "#e4e4e8",
    },
    evasao: ["#fdeeee", "#f5b3b4", "#e0575a", "#9f1f22"],
};

/** Escuro: selecionado, não invertido automaticamente — no fundo escuro
 * "mais" é "mais brilhante", então as rampas vão do escuro ao claro. */
export const CHART_DARK: ChartPalette = {
    brand: "#a2b82e",
    lime: "#dcf366",
    onLime: "#1b1b1d",
    critical: "#f0595c",
    deemphasis: "#3c3c43",
    reference: "#6f7079",
    ink: "#ececef",
    label: "#ececef",
    labelText: "#1b1b1d",
    textMuted: "#7c7d86",
    surface: "#1f1f24",
    tickFont: 11,
    presenca: {
        ramp: ["#5b7115", "#7d9a1e", "#a2bf2e", "#cde26a"],
        none: "#303036",
    },
    evasao: ["#3a2729", "#8f3336", "#cf4648", "#ff7a7c"],
};

/** Quais anos do eixo X mostrar: cada ano precisa de ~52px, então em telas
 * estreitas mostra um a cada ``step`` (contando a partir do último) e sempre
 * o ano em foco, sem vizinhos colados nele. ``width`` 0 = ainda não medido. */
export function yearTickFilter(
    count: number,
    focus: number,
    width: number
): (index: number) => boolean {
    const step =
        width > 0 ? Math.max(1, Math.ceil((52 * count) / Math.max(width - 60, 1))) : 1;
    return (i) =>
        i === focus || ((count - 1 - i) % step === 0 && Math.abs(i - focus) >= step);
}

/** Cor em ``t`` (0-1, fora disso satura) numa rampa de paradas igualmente
 * espaçadas, interpolando em RGB. */
export function rampColor(stops: readonly string[], t: number): string {
    const x = Math.min(Math.max(t, 0), 1) * (stops.length - 1);
    const i = Math.min(Math.floor(x), stops.length - 2);
    const f = x - i;
    const rgb = (hex: string) =>
        [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
    const [a, b] = [rgb(stops[i]), rgb(stops[i + 1])];
    return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(" ")})`;
}
