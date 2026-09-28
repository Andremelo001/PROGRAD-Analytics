import type { ReactNode } from "react";

import { useDashboardData } from "@/hooks/useDashboardData";
import type { DashboardData } from "@/types/dashboard";

/** Evita repetir o boilerplate de loading/erro em toda página — só chama
 * `render(data)` quando o `dashboard.json` já carregou com sucesso. */
export function DataState({ render }: { render: (data: DashboardData) => ReactNode }) {
    const { data, loading, error } = useDashboardData();

    if (loading) {
        return (
            <p className="flex items-center gap-2 text-[14px] text-white/70">
                <span
                    aria-hidden
                    className="border-t-lime h-4 w-4 animate-spin rounded-full border-2 border-white/20"
                />
                Carregando dados do painel…
            </p>
        );
    }
    if (error) {
        return (
            <p className="text-status-critical bg-popover rounded-xl border border-current/20 px-4 py-3 text-[14px] font-medium">
                Erro ao carregar dashboard.json: {error}
            </p>
        );
    }
    if (!data) {
        return null;
    }
    return <>{render(data)}</>;
}
