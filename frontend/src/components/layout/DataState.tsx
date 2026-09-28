import type { ReactNode } from "react";

import { useDashboardData } from "@/hooks/useDashboardData";
import type { DashboardData } from "@/types/dashboard";

/** Evita repetir o boilerplate de loading/erro em toda página — só chama
 * `render(data)` quando o `dashboard.json` já carregou com sucesso. */
export function DataState({ render }: { render: (data: DashboardData) => ReactNode }) {
    const { data, loading, error } = useDashboardData();

    if (loading) {
        return <p className="text-white/80">Carregando dados do painel…</p>;
    }
    if (error) {
        return (
            <p className="font-bold text-white">
                Erro ao carregar dashboard.json: {error}
            </p>
        );
    }
    if (!data) {
        return null;
    }
    return <>{render(data)}</>;
}
