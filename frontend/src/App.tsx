import { RouterProvider } from "react-router-dom";

import { DashboardDataProvider } from "@/context/DashboardDataProvider";
import { ThemeProvider } from "@/context/ThemeProvider";
import { router } from "@/router";

export function App() {
    return (
        <ThemeProvider>
            <DashboardDataProvider>
                <RouterProvider router={router} />
            </DashboardDataProvider>
        </ThemeProvider>
    );
}
