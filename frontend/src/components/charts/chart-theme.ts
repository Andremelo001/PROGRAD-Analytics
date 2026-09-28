// Cores dos gráficos em hex (espelham os tokens de src/index.css): atributos de
// SVG (stroke/fill) não resolvem var(--...) de forma confiável.
export const CHART = {
    brand: "#016bae", // série única — validada contra o card branco (dataviz)
    deemphasis: "#898781", // "resto/ausência" no modo ênfase
    grid: "#e1e0d9",
    axis: "#c3c2b7",
    textMuted: "#898781",
    surface: "#ffffff",
    tickFont: 12,
} as const;
