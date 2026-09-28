import { useContext } from "react";

import {
    DashboardDataContext,
    type DashboardDataContextValue,
} from "@/context/dashboard-data-context";

export function useDashboardData(): DashboardDataContextValue {
    const context = useContext(DashboardDataContext);
    if (context === undefined) {
        throw new Error(
            "useDashboardData precisa ser usado dentro de <DashboardDataProvider>"
        );
    }
    return context;
}
