import { createHashRouter, Navigate } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { CampusPage } from "@/pages/CampusPage";
import { ConfiguracoesPage } from "@/pages/ConfiguracoesPage";
import { CursoDetalhePage } from "@/pages/CursoDetalhePage";
import { HomePage } from "@/pages/HomePage";
import { QualidadePage } from "@/pages/QualidadePage";
import { ComparacoesPage } from "@/pages/qualidade/ComparacoesPage";
import { MapaPageLazy } from "@/pages/qualidade/MapaPageLazy";
import { PorCursoPage } from "@/pages/qualidade/PorCursoPage";
import { VisaoCampusPage } from "@/pages/qualidade/VisaoCampusPage";
import { TrajetoriaPage } from "@/pages/TrajetoriaPage";

// HashRouter (não BrowserRouter) de propósito: GitHub Pages é hospedagem
// estática pura — um refresh em /PROGRAD-Analytics/qualidade daria 404
// porque não existe esse arquivo no servidor. Com hash (/#/qualidade) o
// navegador nunca manda essa rota pro servidor, só pro JS local.
export const router = createHashRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            { index: true, element: <HomePage /> },
            {
                path: "qualidade",
                element: <QualidadePage />,
                children: [
                    { index: true, element: <Navigate to="campus" replace /> },
                    { path: "campus", element: <VisaoCampusPage /> },
                    { path: "curso/:codigo?", element: <PorCursoPage /> },
                    {
                        path: "mapa",
                        element: <MapaPageLazy />,
                    },
                    { path: "comparacoes", element: <ComparacoesPage /> },
                ],
            },
            { path: "trajetoria", element: <TrajetoriaPage /> },
            { path: "campus", element: <CampusPage /> },
            { path: "cursos/:codigoCurso", element: <CursoDetalhePage /> },
            { path: "configuracoes", element: <ConfiguracoesPage /> },
        ],
    },
]);
