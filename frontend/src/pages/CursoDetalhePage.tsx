import { useParams } from "react-router-dom";

import { DataState } from "@/components/layout/DataState";
import { toTitleCase } from "@/lib/format";

export function CursoDetalhePage() {
    const { codigoCurso } = useParams<{ codigoCurso: string }>();

    return (
        <DataState
            render={(data) => {
                const curso = data.cursos.find(
                    (item) => String(item.codigo_curso) === codigoCurso
                );

                if (!curso) {
                    return (
                        <p className="font-bold text-white">
                            Curso não encontrado no escopo.
                        </p>
                    );
                }

                return (
                    <div>
                        <h1 className="text-2xl font-bold">
                            {toTitleCase(curso.nome_curso)}
                        </h1>
                        <p className="text-white/80">
                            {curso.grau_academico ?? "—"} ·{" "}
                            {curso.modalidade_ensino ?? "—"}
                        </p>
                        {/* TODO: KPIs, evolução do CPC, radar, funil por coorte e curva de
                sobrevivência — curso_perfil, filtrado por este codigo_curso */}
                    </div>
                );
            }}
        />
    );
}
