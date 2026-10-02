import { useState } from "react";

import brasao from "@/assets/brasao.png";
import { CampusSelect } from "@/components/layout/CampusSelect";
import { cn } from "@/lib/utils";

const TRANSICAO = "duration-500 ease-in-out motion-reduce:transition-none";

/** Barra do modo apresentação: no lugar da saudação (que sobe com o topo),
 * um card baixo da largura da grade com a frase + seletor de campus à
 * esquerda e o logo à direita — o campus continua trocável durante a
 * apresentação. Entra se abrindo a partir da esquerda (onde fica o seletor)
 * até a ponta direita, enquanto abre o próprio espaço e empurra os cards; sai
 * com a animação inversa. */
export function PresentationBar({ presenting }: { presenting: boolean }) {
    // terminou de abrir: libera o conteúdo pra fora da barra (a lista do
    // seletor abre por cima dos cards); fechando, volta a recortar
    const [aberta, setAberta] = useState(false);
    const vaza = presenting && aberta;

    return (
        <div
            inert={!presenting}
            aria-hidden={!presenting}
            onTransitionEnd={(event) => {
                if (event.target !== event.currentTarget) return;
                setAberta(presenting);
            }}
            className={cn(
                // aberta: acima dos cards, pra lista do seletor abrir por cima deles
                "relative grid transition-[grid-template-rows]",
                vaza && "z-20",
                TRANSICAO,
                presenting ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
        >
            <div className={cn("min-h-0", !vaza && "overflow-hidden")}>
                <div className="pb-5 lg:pb-6">
                    <div
                        className={cn(
                            "bg-surface text-ink ring-card-ring flex h-14 items-center justify-between gap-4 rounded-[18px] px-4 shadow-[0_4px_24px_rgb(0_0_0/0.05)] ring-1 transition-[clip-path,opacity,translate] sm:px-5",
                            TRANSICAO,
                            presenting
                                ? "translate-y-0 opacity-100"
                                : "-translate-y-3 opacity-0"
                        )}
                        style={{
                            // revela da esquerda (lado do seletor) pra direita
                            // (aberta: sem recorte, senão ele cortaria a lista)
                            clipPath: vaza
                                ? "none"
                                : presenting
                                  ? "inset(0 0 0 0 round 18px)"
                                  : "inset(0 78% 0 0 round 18px)",
                        }}
                    >
                        <div className="text-text-secondary min-w-0 text-[13px] leading-snug sm:text-[14px]">
                            <span className="hidden sm:inline">
                                Acompanhe os indicadores da graduação do{" "}
                            </span>
                            UFC Campus <CampusSelect tone="surface" />
                        </div>
                        <div className="flex shrink-0 items-center gap-2.5">
                            <img
                                src={brasao}
                                alt=""
                                width={172}
                                height={207}
                                className="h-8 w-auto"
                            />
                            <span
                                aria-hidden
                                className="bg-ink/25 hidden h-5 w-px sm:block"
                            />
                            <span className="hidden text-[15px] leading-none font-bold tracking-[-0.01em] sm:inline">
                                <span className="sr-only">UFC — PROGRAD </span>
                                Analytics
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
