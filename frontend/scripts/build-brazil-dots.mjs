// Gera src/assets/brazil-dots.json: o mapa do Brasil em matriz de pontos (um
// ponto por célula de uma grade regular, com a UF a que ele pertence) — é o
// desenho do card "Presença no Brasil". Roda uma vez só (o JSON gerado é
// versionado), não faz parte do build:
//
//     node scripts/build-brazil-dots.mjs
//
// Fonte: malha de UFs do IBGE (API de malhas v3, qualidade mínima).
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE =
    "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR" +
    "?formato=application/vnd.geo+json&intrarregiao=UF&qualidade=minima";
const DEST = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "src",
    "assets",
    "brazil-dots.json"
);
const COLUMNS = 56;

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

/** Ray casting num anel [[lon, lat], ...]. */
function inRing([x, y], ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

/** Polígono GeoJSON = anel externo + buracos. */
function inPolygon(point, rings) {
    return inRing(point, rings[0]) && !rings.slice(1).some((r) => inRing(point, r));
}

function polygonsOf(geometry) {
    return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`IBGE respondeu HTTP ${response.status}`);
const geo = await response.json();

const states = geo.features.map((f) => ({
    sigla: UF_SIGLAS[Number(f.properties.codarea)],
    polygons: polygonsOf(f.geometry),
}));

let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
for (const s of states) {
    for (const polygon of s.polygons) {
        for (const [x, y] of polygon[0]) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }
}

// Células quadradas em graus, com a longitude corrigida pela latitude média
// (cos ~15°S) pra o país não sair achatado.
const kx = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
const cell = ((maxX - minX) * kx) / COLUMNS;
const rows = Math.ceil((maxY - minY) / cell);
const centerOf = (c, r) => [minX + ((c + 0.5) * cell) / kx, maxY - (r + 0.5) * cell];

const dots = new Map(); // "c,r" -> sigla
for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COLUMNS; c++) {
        const point = centerOf(c, r);
        const hit = states.find((s) => s.polygons.some((p) => inPolygon(point, p)));
        if (hit) dots.set(`${c},${r}`, hit.sigla);
    }
}

// UF pequena demais pra pegar o centro de alguma célula (DF, SE...): ganha a
// célula mais próxima do seu centroide, pra nunca sumir do mapa.
for (const s of states) {
    if ([...dots.values()].includes(s.sigla)) continue;
    const ring = s.polygons[0][0];
    const cx = ring.reduce((sum, [x]) => sum + x, 0) / ring.length;
    const cy = ring.reduce((sum, [, y]) => sum + y, 0) / ring.length;
    const c = Math.floor(((cx - minX) * kx) / cell);
    const r = Math.floor((maxY - cy) / cell);
    dots.set(`${c},${r}`, s.sigla);
}

const out = {
    fonte: "IBGE, malha de UFs (API de malhas v3)",
    columns: COLUMNS,
    rows,
    dots: [...dots.entries()].map(([key, sigla]) => [
        ...key.split(",").map(Number),
        sigla,
    ]),
};
writeFileSync(DEST, JSON.stringify(out));
console.log(`${out.dots.length} pontos (${COLUMNS}x${rows}) -> ${DEST}`);
