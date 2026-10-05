import {
    CHART_DARK,
    CHART_DARK_ACESSIVEL,
    CHART_LIGHT,
    CHART_LIGHT_ACESSIVEL,
    type ChartPalette,
} from "@/components/charts/chart-theme";
import { useTheme } from "@/hooks/useTheme";

/** Paleta dos gráficos do tema atual (claro/escuro), na versão de cores
 * acessíveis quando ela está ligada nas Configurações. */
export function useChartTheme(): ChartPalette {
    const { theme, coresAcessiveis } = useTheme();
    if (theme === "dark") return coresAcessiveis ? CHART_DARK_ACESSIVEL : CHART_DARK;
    return coresAcessiveis ? CHART_LIGHT_ACESSIVEL : CHART_LIGHT;
}
