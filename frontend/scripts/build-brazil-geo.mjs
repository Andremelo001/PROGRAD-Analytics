// Gera src/assets/brazil-geo.json: o contorno de cada UF já como caminho SVG
// (o mapa da aba Qualidade → Mapa) e o centroide de cada município, na mesma
// projeção (os pontos do zoom num estado). Roda uma vez só (o JSON gerado é
// versionado), não faz parte do build:
//
//     node scripts/build-brazil-geo.mjs
//
// Fonte: malhas de UFs e de municípios do IBGE (API de malhas v3, qualidade
// mínima). Projeção: equiretangular com a longitude corrigida pela latitude
// média (cos ~15°S) — a mesma do mapa em pontos (build-brazil-dots.mjs); pro
// recorte do Brasil não precisa de nada mais elaborado.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MALHA =
    "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR" +
    "?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=";
const DEST = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "src",
    "assets",
    "brazil-geo.json"
);
/** Largura do desenho, em unidades do viewBox. */
const WIDTH = 1000;

// Código IBGE da UF -> sigla (mesma tabela de UF_SIGLAS no backend).
const UF_SIGLAS = {
    11: "RO",
    12: "AC",
    13: "AM",
    14: "RR",
    15: "PA",
    16: "AP",
    17: "TO",
    21: "MA",
    22: "PI",
    23: "CE",
    24: "RN",
    25: "PB",
    26: "PE",
    27: "AL",
    28: "SE",
    29: "BA",
    31: "MG",
    32: "ES",
    33: "RJ",
    35: "SP",
    41: "PR",
    42: "SC",
    43: "RS",
    50: "MS",
    51: "MT",
    52: "GO",
    53: "DF",
};

async function malha(intrarregiao) {
    const response = await fetch(MALHA + intrarregiao);
    if (!response.ok) throw new Error(`IBGE respondeu HTTP ${response.status}`);
    return (await response.json()).features;
}

const polygonsOf = (geometry) =>
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

const ufs = await malha("UF");
const municipios = await malha("municipio");

let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
for (const f of ufs) {
    for (const polygon of polygonsOf(f.geometry)) {
        for (const [x, y] of polygon[0]) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }
}
const kx = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
const scale = WIDTH / ((maxX - minX) * kx);
const height = Math.ceil((maxY - minY) * scale);
const round = (v) => Math.round(v * 10) / 10;
const project = ([lon, lat]) => [
    round((lon - minX) * kx * scale),
    round((maxY - lat) * scale),
];

/** Centroide (fórmula do polígono) do maior anel externo, já projetado. */
function centroid(geometry) {
    let best = null;
    for (const polygon of polygonsOf(geometry)) {
        const ring = polygon[0].map(project);
        let area = 0;
        let cx = 0;
        let cy = 0;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
            area += cross;
            cx += (ring[j][0] + ring[i][0]) * cross;
            cy += (ring[j][1] + ring[i][1]) * cross;
        }
        if (area === 0) continue;
        if (!best || Math.abs(area) > Math.abs(best.area)) {
            best = { area, x: cx / (3 * area), y: cy / (3 * area) };
        }
    }
    return best ? [round(best.x), round(best.y)] : null;
}

function pathOf(geometry) {
    return polygonsOf(geometry)
        .flatMap((polygon) =>
            polygon.map((ring) => {
                const pts = ring.map(project);
                return `M${pts.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
            })
        )
        .join("");
}

const estados = ufs
    .map((f) => {
        const pts = polygonsOf(f.geometry).flatMap((p) => p[0].map(project));
        const xs = pts.map(([x]) => x);
        const ys = pts.map(([, y]) => y);
        return {
            sigla: UF_SIGLAS[Number(f.properties.codarea)],
            path: pathOf(f.geometry),
            centro: centroid(f.geometry),
            caixa: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
        };
    })
    .sort((a, b) => a.sigla.localeCompare(b.sigla));

const centros = {};
for (const f of municipios) {
    const c = centroid(f.geometry);
    if (c) centros[f.properties.codarea] = c;
}

const out = {
    fonte: "IBGE, malhas de UFs e municípios (API de malhas v3)",
    largura: WIDTH,
    altura: height,
    estados,
    municipios: centros,
};
writeFileSync(DEST, JSON.stringify(out));
console.log(
    `${estados.length} UFs, ${Object.keys(centros).length} municípios (${WIDTH}x${height}) -> ${DEST}`
);
