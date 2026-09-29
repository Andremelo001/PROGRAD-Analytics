import { useCallback, useSyncExternalStore } from "react";

/** ``true`` enquanto a media query casa (ex.: ``"(min-width: 1024px)"``),
 * atualizando quando a janela muda de tamanho. */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const media = window.matchMedia(query);
            media.addEventListener("change", onChange);
            return () => media.removeEventListener("change", onChange);
        },
        [query]
    );
    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
