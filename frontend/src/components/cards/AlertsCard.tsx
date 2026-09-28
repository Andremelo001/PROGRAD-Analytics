import { CircleCheck, OctagonAlert, TriangleAlert } from "lucide-react";

import { Card } from "@/components/cards/Card";
import { toTitleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AlertaItem, AlertaSeveridade } from "@/types/dashboard";

const SEVERITY: Record<
    AlertaSeveridade,
    { label: string; icon: typeof TriangleAlert; className: string }
> = {
    critico: {
        label: "Crítico",
        icon: OctagonAlert,
        className: "text-status-critical",
    },
    atencao: {
        label: "Atenção",
        icon: TriangleAlert,
        className: "text-status-warning",
    },
};

/** Alertas automáticos do backend (seção ``alertas``), críticos primeiro.
 * Card pequeno, do tamanho dos stat tiles: se houver mais alertas do que
 * cabe, a lista rola dentro do card. */
export function AlertsCard({
    itens,
    className,
}: {
    itens: AlertaItem[];
    className?: string;
}) {
    const ordered = [...itens].sort(
        (a, b) =>
            Number(b.severidade === "critico") - Number(a.severidade === "critico")
    );

    return (
        <Card className={className}>
            <p className="flex items-center justify-between gap-2 text-[15px] leading-tight font-bold">
                Alertas
                {ordered.length > 0 && (
                    <span className="bg-brand/10 text-ink rounded-full px-2 text-xs leading-5 font-normal">
                        {ordered.length}
                    </span>
                )}
            </p>
            {ordered.length === 0 ? (
                <p className="text-status-good-text mt-2 flex items-center gap-1.5 text-[13px]">
                    <CircleCheck size={16} strokeWidth={2} aria-hidden />
                    Nenhum alerta no momento
                </p>
            ) : (
                <ul className="mt-2 -mr-2 flex min-h-0 flex-col gap-2 overflow-y-auto pr-2">
                    {ordered.map((alerta) => (
                        <AlertRow key={alerta.tipo} alerta={alerta} />
                    ))}
                </ul>
            )}
        </Card>
    );
}

function AlertRow({ alerta }: { alerta: AlertaItem }) {
    const { label, icon: Icon, className } = SEVERITY[alerta.severidade];
    return (
        <li className="flex gap-2">
            <Icon
                size={15}
                strokeWidth={2}
                className={cn("mt-0.5 shrink-0", className)}
                aria-hidden
            />
            <div className="min-w-0 text-[13px] leading-snug">
                <p>
                    <span className="font-bold">{label}:</span> {alerta.mensagem}
                </p>
                <p className="text-text-secondary text-xs">
                    {alerta.cursos.map((curso) => toTitleCase(curso)).join(" · ")}
                </p>
            </div>
        </li>
    );
}
