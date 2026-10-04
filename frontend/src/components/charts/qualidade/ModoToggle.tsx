import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// Última posição da pílula: ao trocar de modo a página de comparação é
// montada de novo (inclusive este botão), então a pílula parte de onde
// estava e desliza até a opção nova — como o destaque das abas.
let ultima: { left: number; width: number } | null = null;

/** Botão de dois (ou mais) modos em pílula, com a opção ativa numa pílula
 * escura que desliza até a escolhida (mesma animação das abas). */
export function ModoToggle<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState(ultima);
    const [animar, setAnimar] = useState(false);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const medir = () => {
            const ativo = el.querySelector<HTMLElement>('[aria-checked="true"]');
            if (!ativo) return null;
            const caixa = el.getBoundingClientRect();
            const alvo = ativo.getBoundingClientRect();
            return { left: alvo.left - caixa.left, width: alvo.width };
        };
        const nova = medir();
        if (!nova) return;
        let frame = 0;
        if (ultima && ultima.left !== nova.left) {
            // desenha na posição antiga e, no quadro seguinte, desliza
            frame = requestAnimationFrame(() => {
                setAnimar(true);
                setPos(nova);
            });
        } else {
            setPos(nova);
            frame = requestAnimationFrame(() => setAnimar(true));
        }
        ultima = nova;
        const observer = new ResizeObserver(() => {
            const m = medir();
            if (m) {
                ultima = m;
                setPos(m);
            }
        });
        observer.observe(el);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [value]);

    return (
        <div
            ref={ref}
            role="radiogroup"
            aria-label={label}
            className="bg-page relative inline-flex rounded-full p-1"
        >
            <span
                aria-hidden
                className={cn(
                    "bg-ink absolute top-1 bottom-1 left-0 rounded-full",
                    animar &&
                        "transition-[transform,width] duration-300 ease-out motion-reduce:transition-none",
                    !pos && "opacity-0"
                )}
                style={
                    pos
                        ? { transform: `translateX(${pos.left}px)`, width: pos.width }
                        : undefined
                }
            />
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={value === o.value}
                    onClick={() => value !== o.value && onChange(o.value)}
                    className={cn(
                        "focus-visible:ring-lime/60 relative rounded-full px-3 py-1.5 text-[12px] whitespace-nowrap transition-colors duration-300 outline-none focus-visible:ring-2 sm:px-4 sm:text-[13px]",
                        value === o.value
                            ? "text-surface font-semibold"
                            : "text-text-secondary hover:text-ink"
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}
