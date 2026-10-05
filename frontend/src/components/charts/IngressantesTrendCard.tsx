import { useId, useMemo, useRef, useState, type PointerEvent } from "react";

import { Card } from "@/components/cards/Card";
import { ChartSelect } from "@/components/charts/ChartSelect";
import { yearTickFilter } from "@/components/charts/chart-theme";
import { DataTable } from "@/components/charts/DataTable";
import { useChartTheme } from "@/hooks/useChartTheme";
import { useElementSize } from "@/hooks/useElementSize";
import { formatInteger, toTitleCase } from "@/lib/format";
import type {
    Curso,
    DemandaIngressantesPonto,
    IngressantesNacionalPonto,
    TendenciaIngressantesPonto,
} from "@/types/dashboard";

const CAMPUS = "campus";

interface Point {
    ano: number;
    valor: number;
    /** Média nacional no mesmo ano (``null`` sem pares naquele ano). */
    nacional: number | null;
}

/** Série escolhida: o total do campus (``campus.tendencia_ingressantes``)
 * ou um curso (``trajetoria_comparada.demanda_ingressantes``), cada ano com
 * a média nacional. No curso, é a média de ingressantes dos cursos-pares; no
 * campus, a soma dessas médias pelos cursos que tiveram turma no ano — o
 * total que o campus teria se cada curso recebesse a média do Brasil. */
function buildSeries(
    escolha: string,
    tendencia: TendenciaIngressantesPonto[],
    demanda: DemandaIngressantesPonto[],
    nacional: IngressantesNacionalPonto[]
): Point[] {
    const media = new Map(
        nacional.map((p) => [
            `${p.codigo_curso}-${p.ano_ingresso}`,
            p.qt_ingressante_media_nacional,
        ])
    );
    if (escolha !== CAMPUS) {
        return demanda
            .filter((p) => String(p.codigo_curso) === escolha)
            .map((p) => ({
                ano: p.ano_ingresso,
                valor: p.qt_ingressante,
                nacional: media.get(`${p.codigo_curso}-${p.ano_ingresso}`) ?? null,
            }))
            .sort((a, b) => a.ano - b.ano);
    }
    const esperado = new Map<number, number>();
    for (const p of demanda) {
        const m = media.get(`${p.codigo_curso}-${p.ano_ingresso}`);
        if (m !== undefined)
            esperado.set(p.ano_ingresso, (esperado.get(p.ano_ingresso) ?? 0) + m);
    }
    return tendencia
        .map((p) => ({
            ano: p.ano_ingresso,
            valor: p.qt_ingressante,
            nacional: esperado.get(p.ano_ingresso) ?? null,
        }))
        .sort((a, b) => a.ano - b.ano);
}

/** Eixo Y com passos "redondos" (1/2/2,5/5 x 10^n) e 5 marcas a partir do
 * zero ou de um piso abaixo do mínimo. */
function buildTicks(values: number[]): number[] {
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const raw = Math.max(max - min, 1) / 3;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
    const lo = Math.max(0, Math.floor(min / step) * step - step);
    const count = Math.ceil((max - lo) / step) + 1;
    return Array.from({ length: count }, (_, i) => lo + i * step);
}

/** Curva suave que não passa do valor dos pontos (cúbica monotônica em x,
 * Fritsch–Carlson — a mesma ideia do ``monotoneX`` do d3). */
function curva(pts: [number, number][]): string {
    const n = pts.length;
    if (n === 0) return "";
    if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
    const dx = pts.slice(1).map((p, i) => p[0] - pts[i][0]);
    const m = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / dx[i]);
    const t = pts.map((_, i) => {
        if (i === 0) return m[0];
        if (i === n - 1) return m[n - 2];
        return m[i - 1] * m[i] <= 0
            ? 0
            : (3 * (dx[i - 1] + dx[i])) /
                  ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
    });
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n - 1; i++) {
        const h = dx[i] / 3;
        d += `C${pts[i][0] + h},${pts[i][1] + h * t[i]},${pts[i + 1][0] - h},${pts[i + 1][1] - h * t[i + 1]},${pts[i + 1][0]},${pts[i + 1][1]}`;
    }
    return d;
}

/** Trechos contínuos (sem ano faltando) de uma série. */
function trechos(pts: ([number, number] | null)[]): [number, number][][] {
    const out: [number, number][][] = [[]];
    for (const p of pts) {
        if (p) out.at(-1)!.push(p);
        else if (out.at(-1)!.length) out.push([]);
    }
    return out.filter((t) => t.length > 0);
}

const PAD = { top: 14, right: 12, bottom: 32, left: 44 };
/** Respiro (px) antes do primeiro e depois do último ano, pras pílulas
 * de valor caberem nas pontas. */
const RESPIRO = 42;

/** Ingressantes por ano, em duas linhas suaves: o campus (ou o curso), em
 * oliva com uma área esmaecida embaixo, e a média nacional, em violeta. No
 * ano em foco, cada linha ganha uma pílula com o valor: a do campus/curso (limão) embaixo do ponto, a da média nacional
 * (violeta) em cima — trocadas no ano em que o campus passa da média, pra
 * uma não cobrir o ponto da outra. Passar o mouse (ou o dedo) muda
 * o foco; ao sair, volta pro último ano. */
export function IngressantesTrendCard({
    tendencia,
    demanda,
    nacional,
    cursos,
    className,
}: {
    tendencia: TendenciaIngressantesPonto[];
    demanda: DemandaIngressantesPonto[];
    nacional: IngressantesNacionalPonto[];
    cursos: Curso[];
    className?: string;
}) {
    const CHART = useChartTheme();
    const gradId = useId();
    const [escolha, setEscolha] = useState(CAMPUS);
    const [hover, setHover] = useState<number | null>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const { width: W, height: H } = useElementSize(boxRef);

    const serie = useMemo(
        () => buildSeries(escolha, tendencia, demanda, nacional),
        [escolha, tendencia, demanda, nacional]
    );
    const sel = hover !== null && hover < serie.length ? hover : serie.length - 1;
    const foco = serie.at(sel);
    const showTick = yearTickFilter(serie.length, sel, W);
    const ticks =
        serie.length > 0
            ? buildTicks(serie.flatMap((p) => [p.valor, p.nacional ?? p.valor]))
            : [0, 1];
    const curso = cursos.find((c) => String(c.codigo_curso) === escolha);
    const nomeSerie = escolha === CAMPUS ? "Campus" : "Curso";
    const subtitulo =
        escolha === CAMPUS
            ? "Total do campus × média nacional dos mesmos cursos, por ano de ingresso"
            : `${toTitleCase(curso?.nome_curso ?? "")} × média dos mesmos cursos no Brasil`;

    // escalas
    const plotW = Math.max(W - PAD.left - PAD.right, 1);
    const plotH = Math.max(H - PAD.top - PAD.bottom, 1);
    const inset = Math.min(RESPIRO, plotW / 4);
    const x = (i: number) =>
        PAD.left +
        inset +
        (serie.length > 1 ? (i * (plotW - 2 * inset)) / (serie.length - 1) : 0);
    const [y0, y1] = [ticks[0], ticks.at(-1)!];
    const y = (v: number) => PAD.top + plotH - ((v - y0) / (y1 - y0 || 1)) * plotH;
    const base = PAD.top + plotH;

    const linhaSerie = serie.map((p, i): [number, number] => [x(i), y(p.valor)]);
    const linhaNacional = trechos(
        serie.map((p, i) => (p.nacional === null ? null : [x(i), y(p.nacional)]))
    );
    const area =
        linhaSerie.length > 1
            ? `${curva(linhaSerie)}L${linhaSerie.at(-1)![0]},${base}L${linhaSerie[0][0]},${base}Z`
            : "";

    function onPointer(e: PointerEvent<SVGRectElement>) {
        if (serie.length === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left + PAD.left;
        const passo = serie.length > 1 ? (plotW - 2 * inset) / (serie.length - 1) : 1;
        const i = Math.round((px - PAD.left - inset) / passo);
        setHover(Math.min(Math.max(i, 0), serie.length - 1));
    }

    const fx = foco ? x(sel) : 0;
    const fy = foco ? y(foco.valor) : 0;
    const fyN = foco?.nacional != null ? y(foco.nacional) : null;
    // campus/curso embaixo da linha e média nacional em cima; se o campus
    // está acima da média, invertem
    const campusEmCima = fyN !== null && fy < fyN;

    return (
        <Card
            title="Ingressantes"
            subtitle={subtitulo}
            action={
                <ChartSelect
                    label="Série exibida"
                    value={escolha}
                    options={[
                        { value: CAMPUS, label: "Campus" },
                        ...cursos.map((c) => ({
                            value: String(c.codigo_curso),
                            label: toTitleCase(c.nome_curso),
                        })),
                    ]}
                    onChange={(value) => {
                        setEscolha(value);
                        setHover(null);
                    }}
                />
            }
            className={className}
        >
            {/* só gráfico na tela; os valores seguem legíveis por leitor de tela */}
            <div className="sr-only">
                <DataTable
                    columns={["Ano de ingresso", nomeSerie, "Média nacional"]}
                    rows={serie.map((p) => [
                        String(p.ano),
                        formatInteger(p.valor),
                        p.nacional === null ? "—" : formatInteger(p.nacional),
                    ])}
                />
            </div>
            {serie.length === 0 ? (
                <p className="text-text-secondary mt-6 text-[13px]">
                    Sem dado de ingressantes para esta série.
                </p>
            ) : (
                <>
                    <div ref={boxRef} className="relative mt-4 min-h-[240px] flex-1">
                        {W > 0 && H > 0 && (
                            <svg
                                width={W}
                                height={H}
                                className="absolute inset-0 touch-pan-y select-none"
                                aria-hidden
                            >
                                <defs>
                                    <linearGradient
                                        id={gradId}
                                        x1="0"
                                        x2="0"
                                        y1="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor={CHART.comparacao.a}
                                            stopOpacity={0.28}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor={CHART.comparacao.a}
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>

                                {/* grade horizontal e eixo Y */}
                                {ticks.map((t) => (
                                    <g key={t}>
                                        <line
                                            x1={PAD.left}
                                            x2={W - PAD.right}
                                            y1={y(t)}
                                            y2={y(t)}
                                            stroke={CHART.deemphasis}
                                            strokeOpacity={0.7}
                                        />
                                        <text
                                            x={PAD.left - 10}
                                            y={y(t) + 4}
                                            textAnchor="end"
                                            fontSize={CHART.tickFont}
                                            fill={CHART.textMuted}
                                        >
                                            {formatInteger(t)}
                                        </text>
                                    </g>
                                ))}

                                {/* campus/curso: área esmaecida + linha */}
                                <path d={area} fill={`url(#${gradId})`} />
                                <path
                                    d={curva(linhaSerie)}
                                    fill="none"
                                    stroke={CHART.comparacao.a}
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                                {/* média nacional */}
                                {linhaNacional.map((t, i) => (
                                    <path
                                        key={i}
                                        d={curva(t)}
                                        fill="none"
                                        stroke={CHART.comparacao.b}
                                        strokeWidth={2.5}
                                        strokeLinecap="round"
                                    />
                                ))}

                                {/* pontos em foco, cada um com a pílula do valor */}
                                {foco && fyN !== null && (
                                    <Ponto
                                        cx={fx}
                                        cy={fyN}
                                        cor={CHART.comparacao.b}
                                        fundo={CHART.surface}
                                        texto={formatInteger(foco.nacional!)}
                                        textoCor="#ffffff"
                                        emCima={!campusEmCima}
                                    />
                                )}
                                {foco && (
                                    <Ponto
                                        cx={fx}
                                        cy={fy}
                                        cor={CHART.comparacao.a}
                                        fundo={CHART.surface}
                                        pilula={CHART.lime}
                                        texto={formatInteger(foco.valor)}
                                        textoCor={CHART.onLime}
                                        emCima={campusEmCima}
                                    />
                                )}

                                {/* eixo X */}
                                {serie.map(
                                    (p, i) =>
                                        showTick(i) && (
                                            <text
                                                key={p.ano}
                                                x={x(i)}
                                                y={H - 10}
                                                textAnchor="middle"
                                                fontSize={11.5}
                                                fontWeight={i === sel ? 700 : 400}
                                                fill={
                                                    i === sel
                                                        ? CHART.ink
                                                        : CHART.textMuted
                                                }
                                            >
                                                {p.ano}
                                            </text>
                                        )
                                )}

                                {/* captura do mouse/dedo sobre a área do gráfico */}
                                <rect
                                    x={PAD.left}
                                    y={0}
                                    width={plotW}
                                    height={H}
                                    fill="transparent"
                                    onPointerMove={onPointer}
                                    onPointerDown={onPointer}
                                    onPointerLeave={() => setHover(null)}
                                />
                            </svg>
                        )}
                    </div>
                    <div className="text-text-secondary mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
                        <Legenda cor={CHART.comparacao.a} label={nomeSerie} />
                        <Legenda cor={CHART.comparacao.b} label="Média nacional" />
                    </div>
                </>
            )}
        </Card>
    );
}

function Legenda({ cor, label }: { cor: string; label: string }) {
    return (
        <span className="flex items-center gap-2">
            <span
                aria-hidden
                className="h-[3px] w-4 rounded-full"
                style={{ background: cor }}
            />
            {label}
        </span>
    );
}

/** Ponto em foco de uma linha, com uma pílula pequena do valor logo acima ou
 * logo abaixo dele. */
function Ponto({
    cx,
    cy,
    cor,
    fundo,
    pilula = cor,
    texto,
    textoCor,
    emCima,
}: {
    cx: number;
    cy: number;
    cor: string;
    fundo: string;
    pilula?: string;
    texto: string;
    textoCor: string;
    emCima: boolean;
}) {
    const w = texto.length * 7 + 18;
    // sem espaço acima (ponto colado no topo do gráfico), a pílula vai pro
    // lado esquerdo do ponto, na mesma altura
    const lado = emCima && cy - 34 < 0;
    const top = lado ? cy - 12 : emCima ? cy - 34 : cy + 10;
    const centro = lado ? cx - 12 - w / 2 : cx;
    return (
        <g>
            <circle cx={cx} cy={cy} r={5} fill={fundo} stroke={cor} strokeWidth={2.5} />
            <rect
                x={centro - w / 2}
                y={top}
                width={w}
                height={24}
                rx={8}
                fill={pilula}
            />
            <text
                x={centro}
                y={top + 16}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fill={textoCor}
            >
                {texto}
            </text>
        </g>
    );
}
