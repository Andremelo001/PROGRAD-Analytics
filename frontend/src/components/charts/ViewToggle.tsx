import { ChartColumn, Table2 } from "lucide-react";

import { cn } from "@/lib/utils";

/** Alterna gráfico <-> tabela: a tabela é a versão acessível de todo gráfico
 * (nenhum valor fica preso ao tooltip ou à cor). */
export function ViewToggle({
    showTable,
    onToggle,
}: {
    showTable: boolean;
    onToggle: () => void;
}) {
    const Icon = showTable ? ChartColumn : Table2;
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={showTable}
            className="text-text-secondary hover:bg-brand/5 hover:text-ink flex shrink-0 items-center gap-1 rounded-full border border-black/10 px-2.5 py-0.5 text-xs transition-colors"
        >
            <Icon size={14} strokeWidth={2} aria-hidden />
            {showTable ? "Gráfico" : "Tabela"}
        </button>
    );
}

/** Tabela da alternância gráfico <-> tabela: primeira coluna é o rótulo
 * (à esquerda), as demais são valores (à direita). */
export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
    return (
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm tabular-nums">
                <thead className="text-text-secondary sticky top-0 bg-white">
                    <tr>
                        {columns.map((column, index) => (
                            <th
                                key={column}
                                scope="col"
                                className={cn(
                                    "py-1 font-normal",
                                    index > 0 && "text-right"
                                )}
                            >
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(([label, ...values]) => (
                        <tr key={label} className="border-chart-grid border-t">
                            <td className="py-1">{label}</td>
                            {values.map((value, index) => (
                                <td key={index} className="py-1 text-right">
                                    {value}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
