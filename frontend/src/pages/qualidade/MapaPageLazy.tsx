import { lazy, Suspense } from "react";

import { MapaEsqueleto } from "@/components/layout/Esqueleto";
import { carregarMapa, mapaCarregado } from "@/pages/qualidade/mapa-loader";

// O Mapa traz a malha do Brasil (~190 KB): só é baixado quando a Qualidade
// abre (pré-carga) ou quando a sub-aba é aberta direto pelo link.
const MapaPage = lazy(() => carregarMapa().then((m) => ({ default: m.MapaPage })));

export function MapaPageLazy() {
    // já pré-carregado: desenha direto (o ``lazy`` ainda esperaria um ciclo
    // e piscaria o esqueleto)
    const pronto = mapaCarregado();
    if (pronto) return <pronto.MapaPage />;
    return (
        <Suspense fallback={<MapaEsqueleto />}>
            <MapaPage />
        </Suspense>
    );
}
