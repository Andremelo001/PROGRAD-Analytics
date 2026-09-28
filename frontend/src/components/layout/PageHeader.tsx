import { useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { PageHeaderSlotContext } from "@/context/page-header-slot";

/** Saudação/título das páginas, em branco sobre a faixa escura. É desenhado
 * no topo fixo do ``AppLayout`` (via portal), junto com o logo, a busca e as
 * abas; em lg+ as abas ficam à direita desta linha, então o texto reserva
 * esse espaço. Fora do layout (sem slot), aparece no próprio lugar. */
export function PageHeader({
    title,
    subtitle,
}: {
    title: string;
    subtitle?: ReactNode;
}) {
    const slot = useContext(PageHeaderSlotContext);
    const header = (
        <header className="min-w-0 shrink-0 lg:max-w-[calc(100%-520px)]">
            <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] text-white lg:text-[30px]">
                {title}
            </h1>
            {subtitle && (
                <p className="mt-2 text-[14px] leading-snug text-white/65">
                    {subtitle}
                </p>
            )}
        </header>
    );
    return slot ? createPortal(header, slot) : header;
}
