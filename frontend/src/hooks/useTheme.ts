import { useContext } from "react";

import { ThemeContext, type ThemeContextValue } from "@/context/theme-context";

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme precisa ser usado dentro de <ThemeProvider>");
    }
    return context;
}
