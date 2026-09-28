import { createContext } from "react";

import type { DashboardData } from "@/types/dashboard";

export interface DashboardDataContextValue {
    data: DashboardData | null;
    loading: boolean;
    error: string | null;
}

export const DashboardDataContext = createContext<
    DashboardDataContextValue | undefined
>(undefined);
