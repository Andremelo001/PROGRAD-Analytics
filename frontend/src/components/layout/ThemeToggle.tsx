import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

/** Alterna claro/escuro: mostra o sol no modo claro e a lua no escuro. Fica
 * sobre a faixa escura (escura nos dois temas), então o estilo é o mesmo dos
 * controles dela — fundo ``band-soft`` e ícone branco. */
export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const dark = theme === "dark";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
            title={dark ? "Modo claro" : "Modo escuro"}
            className="bg-band-soft focus-visible:ring-lime/60 relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 text-white transition-colors outline-none hover:border-white/25 focus-visible:ring-2 sm:h-9 sm:w-9"
        >
            {/* os dois ícones sempre montados: um gira e some enquanto o
                outro entra, sem salto de layout */}
            <Sun
                size={17}
                strokeWidth={2}
                aria-hidden
                className={cn(
                    "absolute transition-all duration-300",
                    dark
                        ? "scale-50 -rotate-90 opacity-0"
                        : "scale-100 rotate-0 opacity-100"
                )}
            />
            <Moon
                size={16}
                strokeWidth={2}
                aria-hidden
                className={cn(
                    "absolute transition-all duration-300",
                    dark
                        ? "scale-100 rotate-0 opacity-100"
                        : "scale-50 rotate-90 opacity-0"
                )}
            />
        </button>
    );
}
