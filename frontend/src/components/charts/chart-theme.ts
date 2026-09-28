// Cores dos gráficos em hex (espelham os tokens de src/index.css): atributos de
// SVG (stroke/fill) não resolvem var(--...) de forma confiável.
export const CHART = {
    brand: "#a2b82e", // série principal (oliva)
    lime: "#dcf366", // realce do ponto/ano selecionado
    critical: "#e5484d", // série "ruim" (evasão)
    deemphasis: "#d9d9dd", // trecho fora de foco / resto
    ink: "#1b1b1d",
    textMuted: "#9a9ba3",
    surface: "#ffffff",
    tickFont: 11,
} as const;

/** Mapa de presença por UF: rampa ordinal oliva (validada com ``--ordinal``;
 * a ponta clara ainda passa 2:1 contra o card branco) para a quantidade de
 * cursos, e cinza para "sem oferta" — como os pontos apagados do design. */
export const PRESENCA_UF = {
    ramp: ["#a4c236", "#86a320", "#678015", "#4a5d0c"],
    none: "#e4e4e8",
} as const;
