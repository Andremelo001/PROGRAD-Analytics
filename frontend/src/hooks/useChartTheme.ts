import {
    CHART_DARK,
    CHART_LIGHT,
    type ChartPalette,
} from "@/components/charts/chart-theme";
import { useTheme } from "@/hooks/useTheme";

/** Paleta dos gráficos do tema atual (claro/escuro). */
export function useChartTheme(): ChartPalette {
    return useTheme().theme === "dark" ? CHART_DARK : CHART_LIGHT;
}
