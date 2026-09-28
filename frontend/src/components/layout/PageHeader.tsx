import type { ReactNode } from "react";

/** Cabeçalho das páginas: título + subtítulo à esquerda e um slot à direita
 * (a busca, na home). Em lg+ tem a altura do bloco do logo (h-16), pra que as
 * duas colunas do layout fiquem alinhadas. */
export function PageHeader({
    title,
    subtitle,
    aside,
}: {
    title: string;
    subtitle?: string;
    aside?: ReactNode;
}) {
    return (
        <header className="flex shrink-0 flex-col gap-3 lg:h-16 lg:flex-row lg:items-center lg:gap-8">
            <div className="min-w-0 flex-1">
                <h1 className="text-[22px] leading-tight">{title}</h1>
                {subtitle && (
                    <p className="text-[15px] leading-snug text-white/80">{subtitle}</p>
                )}
            </div>
            {aside}
        </header>
    );
}
