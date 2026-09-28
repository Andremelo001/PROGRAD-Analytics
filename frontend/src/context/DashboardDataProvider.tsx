import { useEffect, useState, type ReactNode } from "react";

import { DashboardDataContext } from "@/context/dashboard-data-context";
import type { DashboardData } from "@/types/dashboard";

// import.meta.env.BASE_URL já reflete o `base` do vite.config.ts (inclui o
// prefixo /PROGRAD-Analytics/ quando buildado pro GitHub Pages) — assim o
// fetch funciona igual em dev e em produção sem configuração extra.
const DATA_URL = `${import.meta.env.BASE_URL}data/dashboard.json`;

export function DashboardDataProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetch(DATA_URL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        `Falha ao carregar dashboard.json (HTTP ${response.status})`
                    );
                }
                return response.json() as Promise<DashboardData>;
            })
            .then((json) => {
                if (!cancelled) setData(json);
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Erro desconhecido");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <DashboardDataContext.Provider value={{ data, loading, error }}>
            {children}
        </DashboardDataContext.Provider>
    );
}
