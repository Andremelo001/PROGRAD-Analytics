import { createContext } from "react";

export type Theme = "light" | "dark";
/** Escolha de tema da página Configurações: ``"system"`` segue o sistema. */
export type ThemePreference = Theme | "system";

export interface ThemeContextValue {
    /** Tema em uso (``preference`` já resolvida). */
    theme: Theme;
    preference: ThemePreference;
    setPreference: (preference: ThemePreference) => void;
    /** Botão da faixa do topo: fixa o oposto do tema em uso. */
    toggleTheme: () => void;
    /** Cores acessíveis (daltonismo): azul e laranja no lugar de verde e
     * vermelho nos significados de bom/ruim. */
    coresAcessiveis: boolean;
    setCoresAcessiveis: (ativo: boolean) => void;
    /** Volta tudo ao padrão (tema automático, cores normais). */
    restaurarPadroes: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Chaves no localStorage — o script do index.html lê as mesmas. */
export const THEME_STORAGE_KEY = "prograd-theme";
export const CORES_STORAGE_KEY = "prograd-cores-acessiveis";
