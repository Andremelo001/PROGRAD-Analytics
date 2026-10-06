import { Info } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/cards/Card";
import { DeltaPill } from "@/components/charts/qualidade/DeltaPill";
import { useChartTheme } from "@/hooks/useChartTheme";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { formatDecimal, formatPercent, formatPoints } from "@/lib/format";
import { comCpc, media, type AvaliacaoCurso } from "@/lib/qualidade";
import { cn } from "@/lib/utils";
import type { DistribuicaoCpcFaixaNacionalItem } from "@/types/dashboard";

/** Quatro indicadores do campus no topo da Visão do campus: CPC médio,
 * cursos por faixa, % nas faixas 4-5 e cursos sem CPC. */
export function QualidadeResumo({
    avaliacoes,
    faixasNacional,
}: {
    avaliacoes: AvaliacaoCurso[];
    faixasNacional: DistribuicaoCpcFaixaNacionalItem[];
}) {
    const CHART = useChartTheme();
    const avaliados = comCpc(avaliacoes);

    // CPC médio × média nacional das mesmas áreas, nos mesmos anos (pareado:
    // só cursos que têm as duas pontas)
    const pareados = avaliados.filter((a) => a.cpcNacional !== null);
    const cpcMedio = media(avaliados.map((a) => a.cpc));
    const cpcNacional = media(pareados.map((a) => a.cpcNacional!));
    const cpcPareado = media(pareados.map((a) => a.cpc));

    const porFaixa = [1, 2, 3, 4, 5].map(
        (f) => avaliacoes.filter((a) => a.faixa === f).length
    );
    const comFaixa = porFaixa.reduce((a, b) => a + b, 0);
    const faixasUsadas = porFaixa.filter((n) => n > 0).length;
    // em 2 colunas (tablet) os tiles dividem a linha e são largos: ali o
    // empilhado passaria da altura dos vizinhos, então fica sempre lado a lado
    const duasColunas = useMediaQuery("(min-width: 640px) and (max-width: 1023.98px)");
    const empilhado = faixasUsadas <= 2 && !duasColunas;
    // tamanho do medidor empilhado: no celular (um tile por linha) não
    // divide altura com ninguém e pode crescer; no desktop, o maior que
    // ainda cabe na altura dos outros três
    const celular = useMediaQuery("(max-width: 639.98px)");
    const larguraGauge = !empilhado ? 128 : celular ? 156 : 118;
    // legenda: em linha embaixo do medidor (poucas faixas) ou em lista ao lado
    const legendaFaixas = (
        <span
            className={cn(
                "text-text-secondary flex text-[12px] leading-snug",
                empilhado ? "flex-wrap justify-center gap-x-3" : "flex-col gap-1"
            )}
        >
            {porFaixa.map((n, i) =>
                n === 0 ? null : (
                    <span
                        key={i}
                        className="flex items-center gap-1.5 whitespace-nowrap"
                    >
                        <span
                            aria-hidden
                            className="h-2 w-2 rounded-[3px]"
                            style={{ background: CHART.faixa.ramp[i] }}
                        />
                        Faixa {i + 1}:{" "}
                        <span className="text-ink font-semibold">{n}</span>
                    </span>
                )
            )}
        </span>
    );
    const altas = porFaixa[3] + porFaixa[4];
    const pctAltas = comFaixa > 0 ? (100 * altas) / comFaixa : null;
    const pctAltasNacional = faixasNacional
        .filter((f) => f.cpc_faixa === "4" || f.cpc_faixa === "5")
        .reduce((total, f) => total + f.percentual_nacional, 0);
    const temNacional = faixasNacional.length > 0;

    const semCpc = avaliacoes.filter((a) => a.cpc === null);
    const nuncaAvaliados = semCpc.filter((a) => a.ano === null).length;
    const semConceito = semCpc.length - nuncaAvaliados;

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-4 lg:gap-6">
            <Tile
                label="CPC médio"
                info="Média do CPC contínuo da avaliação mais recente de cada curso. A média nacional é a dos cursos das mesmas áreas, no mesmo ano de avaliação."
                value={cpcMedio === null ? "—" : formatDecimal(cpcMedio)}
                badge={
                    cpcPareado !== null && cpcNacional !== null ? (
                        <DeltaPill diff={cpcPareado - cpcNacional} />
                    ) : null
                }
                footer={
                    cpcNacional === null
                        ? "Sem média nacional para comparar"
                        : `Média nacional das mesmas áreas: ${formatDecimal(cpcNacional)}`
                }
            />
            <Tile
                label="Cursos por faixa"
                info="Faixa do CPC (1 a 5) na avaliação mais recente de cada curso."
            >
                {/* poucas faixas (legenda curta): medidor no centro e a legenda
                    numa linha embaixo; com mais faixas, a legenda vira uma lista
                    à esquerda e o medidor vai pra direita — sempre na mesma
                    altura que os outros três tiles ocupam */}
                <div
                    className={cn(
                        "flex",
                        empilhado
                            ? "flex-col items-center gap-1"
                            : "items-end justify-between gap-3"
                    )}
                >
                    {!empilhado && legendaFaixas}
                    <FaixasGauge
                        porFaixa={porFaixa}
                        total={comFaixa}
                        largura={larguraGauge}
                    />
                    {empilhado && legendaFaixas}
                </div>
            </Tile>
            <Tile
                label="Nas faixas 4 e 5"
                info="Percentual dos cursos com faixa 4 ou 5. No Brasil, entre os cursos das mesmas áreas (avaliação mais recente de cada um)."
                value={pctAltas === null ? "—" : formatPercent(pctAltas, 0)}
                badge={
                    pctAltas !== null && temNacional ? (
                        <DeltaPill
                            diff={pctAltas - pctAltasNacional}
                            limiar={0.5}
                            format={(v) => formatPoints(v, 0)}
                        />
                    ) : null
                }
                footer={
                    temNacional
                        ? `No Brasil, nas mesmas áreas: ${formatPercent(pctAltasNacional, 0)}`
                        : "Sem dado nacional para comparar"
                }
            />
            <Tile
                label="Sem CPC"
                info="Cursos sem conceito na avaliação mais recente (SC) ou que ainda não passaram por avaliação — por exemplo, cursos novos, sem concluintes no Enade."
                value={`${semCpc.length} de ${avaliacoes.length}`}
                lateral={
                    <SemCpcDonut
                        tamanho={duasColunas ? 60 : 76}
                        total={avaliacoes.length}
                        nunca={nuncaAvaliados}
                        sc={semConceito}
                    />
                }
                footer={
                    semCpc.length === 0 ? (
                        "Todos os cursos têm CPC"
                    ) : (
                        <span className="flex flex-wrap gap-x-3 gap-y-1 sm:max-lg:gap-x-2 sm:max-lg:text-[11px]">
                            {nuncaAvaliados > 0 && (
                                <ItemLegenda cor={CHART.brand}>
                                    {nuncaAvaliados === 1
                                        ? "Nunca avaliado"
                                        : "Nunca avaliados"}
                                    :{" "}
                                    <span className="text-ink font-semibold">
                                        {nuncaAvaliados}
                                    </span>
                                </ItemLegenda>
                            )}
                            {semConceito > 0 && (
                                <ItemLegenda cor={CHART.critical}>
                                    {/* em 2 colunas o tile é estreito: "SC" curto
                                        (o ícone de informação explica) */}
                                    {duasColunas ? "SC" : "Sem conceito"}:{" "}
                                    <span className="text-ink font-semibold">
                                        {semConceito}
                                    </span>
                                </ItemLegenda>
                            )}
                        </span>
                    )
                }
            />
        </div>
    );
}

function Tile({
    label,
    info,
    value,
    badge,
    footer,
    lateral,
    children,
}: {
    label: string;
    info: string;
    /** Número grande; sem ele, o tile desenha ``children`` no lugar. */
    value?: string;
    badge?: ReactNode;
    footer?: ReactNode;
    /** Visual pequeno no canto inferior direito, ao lado do número e do
     * rodapé (ex.: a rosca do Sem CPC). */
    lateral?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <Card className="relative overflow-hidden">
            {/* enfeite: pontinhos à direita, sumindo pra esquerda */}
            <span
                aria-hidden
                className="pontilhado pointer-events-none absolute inset-y-0 right-0 w-3/5"
            />
            <div className="relative flex items-center justify-between gap-2">
                <p className="text-[14px] font-medium">{label}</p>
                <span
                    title={info}
                    aria-label={info}
                    className="text-text-muted -mr-1 flex h-6 w-6 items-center justify-center"
                >
                    <Info size={15} strokeWidth={2} aria-hidden />
                </span>
            </div>
            {value !== undefined ? (
                <div className="relative mt-2.5 flex items-center gap-3">
                    <p className="text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
                        {value}
                    </p>
                    {badge}
                </div>
            ) : (
                <div className="relative mt-auto pt-1">{children}</div>
            )}
            {footer !== undefined && (
                <div
                    className={cn(
                        "text-text-secondary relative mt-auto pt-3 text-[12px] leading-snug",
                        lateral !== undefined && "pr-[84px] sm:max-lg:pr-[64px]"
                    )}
                >
                    {footer}
                </div>
            )}
            {lateral !== undefined && (
                <div className="absolute right-5 bottom-5 lg:right-6 lg:bottom-6">
                    {lateral}
                </div>
            )}
        </Card>
    );
}

/** Meio anel (medidor) com os cursos por faixa: um segmento por faixa que
 * tem curso, da 1 (esquerda) à 5 (direita), na rampa azul das faixas, com
 * um respiro entre eles. O total fica no centro. */
function FaixasGauge({
    porFaixa,
    total,
    largura = 128,
}: {
    porFaixa: number[];
    total: number;
    largura?: number;
}) {
    const CHART = useChartTheme();
    const W = largura;
    const R = W * 0.406; // raio até o meio do traço
    const T = W * 0.094; // espessura
    const escala = W / 128; // texto do centro acompanha o tamanho
    const cx = W / 2;
    const cy = R + T / 2 + 2;
    const H = cy + 4;
    const ponto = (a: number) => `${cx + R * Math.cos(a)},${cy - R * Math.sin(a)}`;
    const arco = (de: number, ate: number) =>
        `M${ponto(de)} A${R},${R} 0 0 1 ${ponto(ate)}`;
    const respiro = 3 / R; // ~3px entre os segmentos

    // ângulo onde cada faixa começa: π menos a fração acumulada das anteriores
    const antes = porFaixa.map((_, i) =>
        porFaixa.slice(0, i).reduce((a, b) => a + b, 0)
    );
    const segmentos =
        total === 0
            ? []
            : porFaixa.flatMap((n, i) =>
                  n === 0
                      ? []
                      : [
                            {
                                i,
                                n,
                                de: Math.PI - (antes[i] / total) * Math.PI,
                                ate: Math.PI - ((antes[i] + n) / total) * Math.PI,
                            },
                        ]
              );
    const ultimo = segmentos.length - 1;

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto shrink-0"
            style={{ width: W }}
            role="img"
            aria-label={`${total} ${total === 1 ? "curso" : "cursos"} com faixa: ${segmentos.map((s) => `faixa ${s.i + 1}, ${s.n}`).join("; ")}`}
        >
            {total === 0 ? (
                <path
                    d={arco(Math.PI, 0)}
                    fill="none"
                    stroke={CHART.deemphasis}
                    strokeWidth={T}
                />
            ) : (
                segmentos.map((s, k) => (
                    <path
                        key={s.i}
                        d={arco(
                            s.de - (k > 0 ? respiro / 2 : 0),
                            s.ate + (k < ultimo ? respiro / 2 : 0)
                        )}
                        fill="none"
                        stroke={CHART.faixa.ramp[s.i]}
                        strokeWidth={T}
                    >
                        <title>{`Faixa ${s.i + 1}: ${s.n} ${s.n === 1 ? "curso" : "cursos"}`}</title>
                    </path>
                ))
            )}
            <text
                x={cx}
                y={cy - 13 * escala}
                textAnchor="middle"
                fontSize={22 * escala}
                fontWeight={600}
                letterSpacing="-0.02em"
                className="fill-ink tabular-nums"
            >
                {total}
            </text>
            <text
                x={cx}
                y={cy}
                textAnchor="middle"
                fontSize={Math.max(9, 10 * escala)}
                className="fill-text-muted"
            >
                {total === 1 ? "curso" : "cursos"}
            </text>
        </svg>
    );
}

function ItemLegenda({ cor, children }: { cor: string; children: ReactNode }) {
    return (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-[3px]"
                style={{ background: cor }}
            />
            {children}
        </span>
    );
}

/** Rosca dos cursos do campus: o trilho cinza são os que têm CPC e os
 * segmentos coloridos, os sem CPC — nunca avaliados (cor da série) e sem
 * conceito (SC, cor de alerta), com um respiro entre eles. No centro, o % sem
 * CPC. */
function SemCpcDonut({
    total,
    nunca,
    sc,
    tamanho = 76,
}: {
    total: number;
    nunca: number;
    sc: number;
    tamanho?: number;
}) {
    const CHART = useChartTheme();
    const S = tamanho;
    const T = Math.round(tamanho * 0.13);
    const R = (S - T) / 2;
    const c = S / 2;
    const volta = 2 * Math.PI * R;
    const respiro = 2.5;
    const semCpc = nunca + sc;
    const pct = total > 0 ? Math.round((100 * semCpc) / total) : 0;
    // cada segmento é um traço tracejado no círculo, começando no topo
    const segmentos = [
        {
            n: nunca,
            cor: CHART.brand,
            nome: nunca === 1 ? "nunca avaliado" : "nunca avaliados",
        },
        { n: sc, cor: CHART.critical, nome: "sem conceito (SC)" },
    ].filter((s) => s.n > 0);
    const inicio = segmentos.map((_, k) =>
        segmentos.slice(0, k).reduce((t, s) => t + (s.n / total) * volta, 0)
    );

    return (
        <svg
            width={S}
            height={S}
            viewBox={`0 0 ${S} ${S}`}
            role="img"
            aria-label={`${semCpc} de ${total} cursos sem CPC (${pct}%)`}
            className="-rotate-90"
        >
            <circle
                cx={c}
                cy={c}
                r={R}
                fill="none"
                stroke={CHART.deemphasis}
                strokeWidth={T}
            >
                <title>{`${total - semCpc} com CPC`}</title>
            </circle>
            {total > 0 &&
                segmentos.map((s, k) => {
                    const comprimento = (s.n / total) * volta;
                    const visivel = Math.max(
                        comprimento - (semCpc < total ? respiro : 0),
                        1
                    );
                    return (
                        <circle
                            key={s.nome}
                            cx={c}
                            cy={c}
                            r={R}
                            fill="none"
                            stroke={s.cor}
                            strokeWidth={T}
                            strokeDasharray={`${visivel} ${volta - visivel}`}
                            strokeDashoffset={-inicio[k]}
                        >
                            <title>{`${s.n} ${s.nome}`}</title>
                        </circle>
                    );
                })}
            <text
                x={c}
                y={c}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(90 ${c} ${c})`}
                fontSize={tamanho < 70 ? 13 : 15}
                fontWeight={600}
                className="fill-ink tabular-nums"
            >
                {pct}%
            </text>
        </svg>
    );
}
