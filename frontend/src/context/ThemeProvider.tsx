import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
    CORES_STORAGE_KEY,
    THEME_STORAGE_KEY,
    ThemeContext,
    type ThemePreference,
} from "@/context/theme-context";
import { useMediaQuery } from "@/hooks/useMediaQuery";

function ler(chave: string): string | null {
    try {
        return localStorage.getItem(chave);
    } catch {
        return null; // navegação privada / armazenamento bloqueado
    }
}

function gravar(chave: string, valor: string | null) {
    try {
        if (valor === null) localStorage.removeItem(chave);
        else localStorage.setItem(chave, valor);
    } catch {
        // sem armazenamento: só não lembra
    }
}

function preferenciaSalva(): ThemePreference {
    const salvo = ler(THEME_STORAGE_KEY);
    return salvo === "light" || salvo === "dark" ? salvo : "system";
}

/** Aparência do painel: tema (claro, escuro ou o do sistema) e cores
 * acessíveis. Aplica as classes ``dark`` e ``cores-acessiveis`` no <html> —
 * os tokens de ``index.css`` trocam por elas — e lembra as escolhas no
 * navegador. O script do index.html aplica as mesmas classes antes da
 * primeira pintura (sem "piscar"). */
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [preference, setPreference] = useState<ThemePreference>(preferenciaSalva);
    const [coresAcessiveis, setCoresAcessiveis] = useState(
        () => ler(CORES_STORAGE_KEY) === "1"
    );
    const sistemaEscuro = useMediaQuery("(prefers-color-scheme: dark)");
    const theme =
        preference === "system" ? (sistemaEscuro ? "dark" : "light") : preference;

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
    }, [theme]);
    useEffect(() => {
        gravar(THEME_STORAGE_KEY, preference === "system" ? null : preference);
    }, [preference]);
    useEffect(() => {
        document.documentElement.classList.toggle("cores-acessiveis", coresAcessiveis);
        gravar(CORES_STORAGE_KEY, coresAcessiveis ? "1" : null);
    }, [coresAcessiveis]);

    const toggleTheme = useCallback(
        () => setPreference(theme === "dark" ? "light" : "dark"),
        [theme]
    );
    const restaurarPadroes = useCallback(() => {
        setPreference("system");
        setCoresAcessiveis(false);
    }, []);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                preference,
                setPreference,
                toggleTheme,
                coresAcessiveis,
                setCoresAcessiveis,
                restaurarPadroes,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}
