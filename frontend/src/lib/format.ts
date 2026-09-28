const PT_BR = "pt-BR";

/** 13.8 -> "13,8%" (valores já vêm em pontos percentuais do INEP). */
export function formatPercent(value: number, fractionDigits = 1): string {
    return `${value.toLocaleString(PT_BR, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    })}%`;
}

/** Diferença em pontos percentuais, sem sinal: 8.35 -> "8,4 p.p." */
export function formatPoints(value: number, fractionDigits = 1): string {
    return `${Math.abs(value).toLocaleString(PT_BR, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    })} p.p.`;
}

/** Nota contínua (CPC, Enade — escala 0-5): 3.011 -> "3,01". */
export function formatDecimal(value: number, fractionDigits = 2): string {
    return value.toLocaleString(PT_BR, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
}

/** Inteiro com separador de milhar: 2731155 -> "2.731.155". */
export function formatInteger(value: number): string {
    return value.toLocaleString(PT_BR, { maximumFractionDigits: 0 });
}

/** ISO -> "17/09/2026". */
export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(PT_BR);
}

const LOWERCASE_WORDS = new Set(["de", "da", "do", "das", "dos", "e", "em", "a", "o"]);

/** Nomes do INEP vêm em caixa alta ("ENGENHARIA DE SOFTWARE") ->
 * "Engenharia de Software". Preposições e artigos ficam minúsculos. */
export function toTitleCase(text: string): string {
    return text
        .toLocaleLowerCase(PT_BR)
        .split(/\s+/)
        .map((word, index) =>
            index > 0 && LOWERCASE_WORDS.has(word)
                ? word
                : word.charAt(0).toLocaleUpperCase(PT_BR) + word.slice(1)
        )
        .join(" ");
}

/** Remove acentos e caixa — pra busca "computacao" achar "Computação". */
export function normalizeForSearch(text: string): string {
    return text
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase(PT_BR)
        .trim();
}
