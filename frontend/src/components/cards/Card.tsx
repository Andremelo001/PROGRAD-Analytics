import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Card branco dos painéis. ``title``/``subtitle``
 * seguem a hierarquia de texto do dataviz: título em tinta primária, subtítulo
 * secundário; ``action`` fica à direita do título (ex.: alternar tabela). */
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
                "text-ink flex min-h-0 min-w-0 flex-col rounded-2xl bg-white p-4 lg:p-5",
                className
            )}
        >
            {(title || action) && (
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        {title && (
                            <h2 className="text-[17px] leading-tight font-bold">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-text-secondary text-[13px] leading-snug">
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
