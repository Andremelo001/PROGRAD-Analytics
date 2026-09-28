import { RouterProvider } from "react-router-dom";

import { DashboardDataProvider } from "@/context/DashboardDataProvider";
import { router } from "@/router";

export function App() {
    return (
        <DashboardDataProvider>
            <RouterProvider router={router} />
        </DashboardDataProvider>
    );
}
