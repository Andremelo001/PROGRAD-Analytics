import { DataState } from "@/components/layout/DataState";

export function QualidadePage() {
    return (
        <DataState
            render={(data) => (
                <div>
                    <h1 className="text-2xl font-bold">Qualidade</h1>
                    <p className="text-white/80">
                        {data.comparacao_cursos.ranking_cpc.length} curso(s) com CPC
                        avaliado
                    </p>
                    {/* TODO: ranking_cpc, notas_por_dimensao (radar) e
              evolucao_cpc_comparada — comparacao_cursos + medias_nacionais */}
                </div>
            )}
        />
    );
}
