import { useLayoutEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Uma linha de texto em ``maximo`` px que, quando não cabe, diminui a letra
 * (até ``minimo`` px, ainda legível) pra mostrar tudo; se nem assim couber
 * (ex.: celular), quebra em mais linhas nesse tamanho. Remede a cada mudança
 * de texto e quando a largura muda. */
export function TextoAjustado({
    children,
    className,
    maximo = 13,
    minimo = 11,
}: {
    children: ReactNode;
    className?: string;
    maximo?: number;
    minimo?: number;
}) {
    const ref = useRef<HTMLParagraphElement>(null);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ajustar = () => {
            let tamanho = maximo;
            el.style.whiteSpace = "nowrap";
            el.style.fontSize = `${tamanho}px`;
            while (el.scrollWidth > el.clientWidth && tamanho > minimo) {
                tamanho -= 0.5;
                el.style.fontSize = `${tamanho}px`;
            }
            if (el.scrollWidth > el.clientWidth) el.style.whiteSpace = "normal";
        };
        ajustar();
        const observer = new ResizeObserver(ajustar);
        observer.observe(el);
        return () => observer.disconnect();
    });
    return (
        <p
            ref={ref}
            data-ajustado
            className={cn("overflow-hidden leading-snug", className)}
            style={{ fontSize: maximo }}
        >
            {children}
        </p>
    );
}
