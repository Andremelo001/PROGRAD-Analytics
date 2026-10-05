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
    /** Mapa de presença por UF: rampa ordinal do mais claro (poucos cursos)
     * ao mais escuro (muitos), nos dois temas, e cinza de "sem oferta". */
    presenca: { ramp: readonly string[]; none: string };
    /** Mapa de calor da evasão anual, pela diferença para a média nacional:
     * ``abaixo`` (verde, do claro ao escuro conforme fica menor que a média) e
     * ``acima`` (vermelho, do claro ao escuro conforme fica maior). Os tons do
     * meio são o oliva e o vermelho já usados no sistema. */
    evasao: { abaixo: readonly string[]; acima: readonly string[] };
    /** Faixas 1-5 do CPC: rampa ordinal azul (validada), do claro (faixa 1)
     * ao escuro (faixa 5); ``fg`` é o texto da pílula sobre cada tom. */
    faixa: { ramp: readonly string[]; fg: readonly string[] };
    /** Comparações (Qualidade): as duas séries, A (oliva) e B (violeta) —
     * par categórico validado em cada tema. */
    comparacao: { a: string; b: string };
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
    evasao: {
        abaixo: ["#eef3d0", "#c9d97f", "#a2b82e", "#5d7212"],
        acima: ["#fbe4e4", "#f5b3b4", "#e5484d", "#9f1f22"],
    },
    faixa: {
        ramp: ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"],
        fg: ["#0d2a4f", "#0d2a4f", "#ffffff", "#ffffff", "#ffffff"],
    },
    comparacao: { a: "#8a9e22", b: "#7c4dff" },
};

/** Escuro: tons selecionados pro fundo escuro; nas rampas "mais" continua
 * sendo "mais escuro", como no claro. */
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
        ramp: ["#cde26a", "#a2bf2e", "#7d9a1e", "#5b7115"],
        // cinza médio: o #303036 de antes quase sumia no fundo do card (#1f1f24)
        none: "#5c5d66",
    },
    evasao: {
        abaixo: ["#eef3d0", "#c9d97f", "#a2b82e", "#5d7212"],
        acima: ["#fbe4e4", "#f5b3b4", "#e5484d", "#9f1f22"],
    },
    faixa: {
        ramp: ["#b7d3f6", "#86b6ef", "#5598e7", "#2a78d6", "#1c5cab"],
        fg: ["#0d2a4f", "#0d2a4f", "#0d2a4f", "#ffffff", "#ffffff"],
    },
    comparacao: { a: "#869c20", b: "#7f5ef0" },
};

/** Cores acessíveis (daltonismo): tudo nos gráficos em azul e laranja.
 * Bom/ruim e a série principal em azul × laranja no lugar de oliva ×
 * vermelho; o par da comparação (A × B) no mesmo azul × laranja; o mapa de
 * calor da evasão nas duas rampas; o mapa de presença na rampa azul das
 * faixas; e o limão de destaque num azul claro. O par azul × laranja foi
 * validado com o validate_palette da skill dataviz em cada tema. */
const ACESSIVEL_RAMPAS = {
    abaixo: ["#e3edfb", "#a7c6f1", "#2f6fd0", "#1b4a91"],
    acima: ["#fdebdb", "#f6bd8b", "#e8710a", "#9a4404"],
} as const;

export const CHART_LIGHT_ACESSIVEL: ChartPalette = {
    ...CHART_LIGHT,
    brand: "#2f6fd0",
    critical: "#e8710a",
    lime: "#a9c8f2",
    evasao: ACESSIVEL_RAMPAS,
    presenca: { ramp: CHART_LIGHT.faixa.ramp, none: CHART_LIGHT.presenca.none },
    comparacao: { a: "#2f6fd0", b: "#e8710a" },
};

export const CHART_DARK_ACESSIVEL: ChartPalette = {
    ...CHART_DARK,
    brand: "#4689ea",
    critical: "#e0731c",
    lime: "#8db8f5",
    evasao: ACESSIVEL_RAMPAS,
    presenca: { ramp: CHART_DARK.faixa.ramp, none: CHART_DARK.presenca.none },
    comparacao: { a: "#4689ea", b: "#e0731c" },
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
