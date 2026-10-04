import { useEffect, useState, type RefObject } from "react";

/** Largura e altura (px) de um elemento, atualizadas com ResizeObserver —
 * pra gráficos SVG desenhados à mão ocuparem o espaço que o card dá a eles
 * (ex.: esticados à altura do card vizinho). 0 = ainda não medido. */
export function useElementSize(ref: RefObject<HTMLElement | null>): {
    width: number;
    height: number;
} {
    const [size, setSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) =>
            setSize({
                width: Math.round(entry.contentRect.width),
                height: Math.round(entry.contentRect.height),
            })
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);
    return size;
}
