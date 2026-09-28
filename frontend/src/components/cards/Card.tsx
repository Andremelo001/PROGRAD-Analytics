import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Card branco dos painéis: cantos bem arredondados e sombra difusa, sem
 * borda. ``title``/``subtitle`` formam o cabeçalho (título forte, subtítulo
 * em tinta apagada) e ``action`` fica à direita dele (ex.: seletor de
 * curso). Sem ``title``, o card desenha só o conteúdo. */
export function Card({
    title,
    subtitle,
    action,
    className,
    children,
}: {
    title?: string;
    subtitle?: string;
    action?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            className={cn(
                "bg-surface text-ink ring-card-ring flex min-h-0 min-w-0 flex-col rounded-[18px] p-5 shadow-[0_4px_24px_rgb(0_0_0/0.05)] ring-1 lg:p-6",
                className
            )}
        >
            {title && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* flex-1 + basis-0: o título ocupa o que sobra (subtítulo
                        trunca) e a ação só desce de linha quando nem os 12rem
                        mínimos cabem — o tamanho do texto não mexe no layout */}
                    <div className="min-w-48 flex-1 basis-0">
                        <h2 className="text-[17px] leading-tight font-semibold tracking-[-0.01em]">
                            {title}
                        </h2>
                        {subtitle && (
                            // uma linha só (texto inteiro no hover): subtítulo que
                            // muda com a série escolhida não pode mudar a altura
                            <p
                                className="text-text-muted mt-1 truncate text-[12px]"
                                title={subtitle}
                            >
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}
