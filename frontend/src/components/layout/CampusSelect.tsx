import { ChartSelect } from "@/components/charts/ChartSelect";
import { useDashboardData } from "@/hooks/useDashboardData";

/** "Quixadá" a partir de "UFC Campus Quixadá" — a frase em volta já diz "UFC
 * Campus". */
function nomeCurto(nome: string): string {
    return nome.replace(/^UFC\s+Campus\s+/i, "");
}

/** Seletor de campus no meio da saudação ("…da graduação do UFC Campus
 * [Quixadá ▾]"). Troca o JSON carregado (``DashboardDataProvider``); enquanto
 * o novo campus baixa, a seta vira um indicador de carga. ``tone="surface"``
 * é a versão sobre um card (barra do modo apresentação). */
export function CampusSelect({ tone = "band" }: { tone?: "band" | "surface" }) {
    const { campi, campus, setCampus, switching } = useDashboardData();
    if (campi.length === 0 || campus === null) return null;

    return (
        <ChartSelect
            variant="inline"
            label="Campus"
            value={campus}
            options={campi.map((c) => ({ value: c.slug, label: nomeCurto(c.nome) }))}
            onChange={setCampus}
            busy={switching}
            tone={tone}
        />
    );
}
