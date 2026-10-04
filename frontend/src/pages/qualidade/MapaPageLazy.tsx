import { lazy, Suspense } from "react";

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

/** Mesmo desenho da página (mapa + painel) em cards vazios pulsando,
 * enquanto o código do Mapa chega: a troca de sub-aba não passa por uma tela
 * em branco. */
function MapaEsqueleto() {
    const card =
        "bg-surface ring-card-ring rounded-[18px] shadow-[0_4px_24px_rgb(0_0_0/0.05)] ring-1 motion-safe:animate-pulse";
    return (
        <div
            aria-busy
            aria-label="Carregando o mapa"
            className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6"
        >
            <div className={`${card} aspect-[1/1.05] lg:col-span-7`} />
            <div className={`${card} min-h-80 lg:col-span-5`} />
        </div>
    );
}
