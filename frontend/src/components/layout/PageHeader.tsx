import { useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

import {
    PageHeaderSlotContext,
    PresentationTabsSlotContext,
} from "@/context/page-header-slot";

/** Saudação/título das páginas, em branco sobre a faixa escura. É desenhado
 * no topo fixo do ``AppLayout`` (via portal), junto com o logo, a busca e as
 * abas; em lg+ as abas ficam à direita desta linha, então o texto reserva
 * esse espaço. Fora do layout (sem slot), aparece no próprio lugar.
 *
 * ``tabs`` (ex.: as sub-abas da Qualidade) vem logo abaixo do subtítulo,
 * ainda dentro da faixa, com menos espaço até os cards. É uma função do tom:
 * ``"band"`` na faixa escura e ``"surface"`` no lugar que o layout reserva
 * abaixo da barra do modo apresentação (a faixa some nesse modo). */
export function PageHeader({
    title,
    subtitle,
    tabs,
}: {
    title: string;
    subtitle?: ReactNode;
    tabs?: (tom: "band" | "surface") => ReactNode;
}) {
    const slot = useContext(PageHeaderSlotContext);
    const slotApresentacao = useContext(PresentationTabsSlotContext);
    const header = (
        <header className="min-w-0 shrink-0 lg:max-w-[calc(100%-520px)]">
            <h1 className="text-[21px] leading-tight font-semibold tracking-[-0.02em] text-white lg:text-[24px]">
                {title}
            </h1>
            {subtitle && (
                <div className="mt-1.5 text-[13px] leading-snug text-white/65">
                    {subtitle}
                </div>
            )}
            {tabs && (
                // sub-abas na altura em que os cards do Início começam (mesmo
                // espaço que o Início deixa abaixo da saudação); embaixo, a
                // margem negativa aproxima os cards delas
                <div className="mt-8 -mb-4 lg:mt-10 lg:-mb-5">{tabs("band")}</div>
            )}
        </header>
    );
    return (
        <>
            {slot ? createPortal(header, slot) : header}
            {tabs &&
                slotApresentacao &&
                createPortal(tabs("surface"), slotApresentacao)}
        </>
    );
}
