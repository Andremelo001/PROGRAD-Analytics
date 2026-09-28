import { useCallback, useEffect, useState, type ReactNode } from "react";

import { THEME_STORAGE_KEY, ThemeContext, type Theme } from "@/context/theme-context";

/** Tema inicial: a classe que o script do index.html já pôs no <html> (lida
 * do localStorage ou da preferência do sistema, antes da primeira pintura). */
function initialTheme(): Theme {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Guarda o tema (claro/escuro), aplica a classe ``dark`` no <html> — os
 * tokens de ``index.css`` trocam por ela — e lembra a escolha no navegador. */
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(initialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // navegação privada / armazenamento bloqueado: só não lembra
        }
    }, [theme]);

    const toggleTheme = useCallback(
        () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        []
    );

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
