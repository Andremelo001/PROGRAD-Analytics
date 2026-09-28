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
                "bg-surface text-ink flex min-h-0 min-w-0 flex-col rounded-[18px] p-5 shadow-[0_4px_24px_rgb(0_0_0/0.05)] lg:p-6",
                className
            )}
        >
            {title && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-[17px] leading-tight font-semibold tracking-[-0.01em]">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-text-muted mt-1 text-[12px]">
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
