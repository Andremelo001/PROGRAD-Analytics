import { createContext } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Chave do tema no localStorage — o script do index.html lê a mesma. */
export const THEME_STORAGE_KEY = "prograd-theme";
