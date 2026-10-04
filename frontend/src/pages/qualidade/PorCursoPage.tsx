import { useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { Card } from "@/components/cards/Card";
import { ComponentesDumbbellCard } from "@/components/charts/qualidade/ComponentesDumbbellCard";
import { ContribuicaoCard } from "@/components/charts/qualidade/ContribuicaoCard";
import { OutrosCampiCard } from "@/components/charts/qualidade/OutrosCampiCard";
import { CursoResumoCard } from "@/components/charts/qualidade/CursoResumoCard";
import { ParticipacaoEnadeCard } from "@/components/charts/qualidade/ParticipacaoEnadeCard";
import { ProximaFaixaCard } from "@/components/charts/qualidade/ProximaFaixaCard";
import { DataState } from "@/components/layout/DataState";
import { useDashboardData } from "@/hooks/useDashboardData";
import { buildAvaliacoes, type AvaliacaoCurso } from "@/lib/qualidade";
import type { DashboardData } from "@/types/dashboard";

export function PorCursoPage() {
    return (
        <DataState
            render={(data) => (
                <PorCurso key={data.escopo.codigo_municipio} data={data} />
            )}
        />
    );
}

/** Qualidade → Por curso (``/qualidade/curso/:codigo``): por que o CPC do
 * curso é o que é e onde dá pra melhorar. Sem código (ou com um código de
 * outro campus, depois de trocar o campus), abre o curso de maior CPC. */
function PorCurso({ data }: { data: DashboardData }) {
    const { codigo } = useParams<{ codigo: string }>();
    const navigate = useNavigate();
    const { campus } = useDashboardData();
    const avaliacoes = useMemo(() => buildAvaliacoes(data), [data]);
    const curso = avaliacoes.find((a) => String(a.codigo) === codigo);

    if (!curso) {
        const padrao =
            [...avaliacoes].sort((a, b) => (b.cpc ?? -1) - (a.cpc ?? -1))[0] ?? null;
        return padrao ? (
            <Navigate to={`/qualidade/curso/${padrao.codigo}`} replace />
        ) : (
            <p className="text-text-secondary text-[14px]">
                Nenhum curso neste campus.
            </p>
        );
    }

    const temNotas = curso.cpc !== null && curso.perfil !== undefined;
    return (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
            <CursoResumoCard
                className="lg:col-span-12"
                curso={curso}
                cursos={avaliacoes}
                onChange={(c) => navigate(`/qualidade/curso/${c}`)}
            />
            {/* lado a lado com a mesma altura: o "Quanto falta" acompanha o
                "De onde vem a nota" e rola a lista por dentro */}
            {temNotas && (
                <div className="grid grid-cols-1 gap-5 lg:col-span-12 lg:grid-cols-12 lg:gap-6">
                    <ContribuicaoCard className="lg:col-span-7" curso={curso} />
                    <ProximaFaixaCard
                        className="lg:col-span-5"
                        curso={curso as AvaliacaoCurso & { cpc: number }}
                    />
                </div>
            )}
            {/* embaixo, também lado a lado com a mesma altura: a participação
                acompanha o "Curso × média nacional" (ou o aviso de sem CPC) */}
            <div className="grid grid-cols-1 gap-5 lg:col-span-12 lg:grid-cols-12 lg:gap-6">
                {temNotas ? (
                    <ComponentesDumbbellCard className="lg:col-span-7" curso={curso} />
                ) : (
                    <SemCpcCard className="lg:col-span-7" curso={curso} />
                )}
                <ParticipacaoEnadeCard className="lg:col-span-5" curso={curso} />
            </div>
            {/* o mesmo curso nos outros campi (some sozinho se nenhum oferece) */}
            {campus && (
                <OutrosCampiCard
                    className="lg:col-span-12"
                    codigoCurso={curso.codigo}
                    campusAtual={campus}
                />
            )}
        </div>
    );
}

function SemCpcCard({
    curso,
    className,
}: {
    curso: AvaliacaoCurso;
    className?: string;
}) {
    const nunca = curso.ano === null;
    return (
        <Card
            title={nunca ? "Curso ainda não avaliado" : "Sem conceito nesta avaliação"}
            className={className}
        >
            <p className="text-text-secondary mt-3 max-w-prose text-[14px] leading-relaxed">
                {nunca
                    ? "O CPC só é calculado quando o curso tem concluintes inscritos no Enade da sua área. Cursos novos, ou de áreas que ainda não passaram por um ciclo depois da abertura do curso, aparecem aqui sem nota."
                    : `Na avaliação de ${curso.ano} o curso ficou sem conceito (SC): o INEP não calcula o CPC quando há poucos concluintes participantes ou falta alguma informação do curso. As notas por componente não são divulgadas nesse caso.`}
            </p>
        </Card>
    );
}
