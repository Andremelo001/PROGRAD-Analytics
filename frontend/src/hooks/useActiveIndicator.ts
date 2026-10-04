import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

/** Posição do destaque deslizante de uma barra de abas: mede o link ativo
 * (``aria-current="page"``, que o ``NavLink`` põe sozinho) dentro de
 * ``container`` e devolve ``left``/``width`` pra um elemento absoluto que
 * desliza até ele. Na primeira medida não anima (senão o destaque viria
 * deslizando do canto); depois, ``animar`` liga a transição. Remede quando
 * ``chave`` muda (troca de rota) e quando a barra muda de tamanho. */
export function useActiveIndicator(
    container: RefObject<HTMLElement | null>,
    chave: string
): { style: CSSProperties; visivel: boolean; animar: boolean } {
    const [medida, setMedida] = useState<{ left: number; width: number } | null>(null);
    const [animar, setAnimar] = useState(false);

    useLayoutEffect(() => {
        const el = container.current;
        if (!el) return;
        const medir = () => {
            const ativo = el.querySelector<HTMLElement>('[aria-current="page"]');
            // pela tela, não por offsetLeft: o link pode estar dentro de um
            // ``li`` posicionado (a medida seria relativa a ele)
            const caixa = el.getBoundingClientRect();
            const alvo = ativo?.getBoundingClientRect();
            setMedida(
                alvo
                    ? {
                          left: alvo.left - caixa.left - el.clientLeft,
                          width: alvo.width,
                      }
                    : null
            );
        };
        medir();
        const observer = new ResizeObserver(medir);
        observer.observe(el);
        // as abas também: com a barra de largura fixa (celular), elas mudam de
        // tamanho sem a barra mudar (ex.: a fonte termina de carregar)
        for (const aba of el.querySelectorAll("a")) observer.observe(aba);
        // depois do primeiro quadro desenhado, as próximas mudanças animam
        const frame = requestAnimationFrame(() => setAnimar(true));
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [container, chave]);

    return {
        style: medida
            ? { transform: `translateX(${medida.left}px)`, width: medida.width }
            : {},
        visivel: medida !== null,
        animar,
    };
}
