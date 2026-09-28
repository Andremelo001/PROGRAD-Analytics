import { DataState } from "@/components/layout/DataState";

export function TrajetoriaPage() {
    return (
        <DataState
            render={(data) => (
                <div>
                    <h1 className="text-2xl font-bold">Trajetória</h1>
                    <p className="text-white/80">
                        {data.trajetoria_comparada.evasao_por_curso.length > 0
                            ? "Evasão e demanda de ingressantes por curso"
                            : "Sem dado de trajetória no escopo"}
                    </p>
                    {/* TODO: evasao_por_curso, heatmap_evasao_anual,
              demanda_ingressantes — trajetoria_comparada + medias_nacionais */}
                </div>
            )}
        />
    );
}
