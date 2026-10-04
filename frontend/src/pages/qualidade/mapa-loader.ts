type MapaModule = typeof import("@/pages/qualidade/MapaPage");

let modulo: MapaModule | null = null;

/** Import do Mapa num lugar só: a rota ``lazy`` usa, e a QualidadePage chama
 * antes (quando o navegador fica ocioso) pra o código já estar baixado ao
 * clicar na sub-aba. */
export const carregarMapa = (): Promise<MapaModule> =>
    import("@/pages/qualidade/MapaPage").then((m) => (modulo = m));

/** O módulo do Mapa, se já foi baixado (``null`` se ainda não). */
export const mapaCarregado = (): MapaModule | null => modulo;
