import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import brasao from "@/assets/brasao.png";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { CourseSearch } from "@/components/search/CourseSearch";
import { PageHeaderSlotContext } from "@/context/page-header-slot";
import { useDashboardData } from "@/hooks/useDashboardData";
import { cn } from "@/lib/utils";

// Mesma altura da faixa escura nos dois lugares em que ela é desenhada (atrás
// da página e dentro do topo fixo): assim as ondas se encaixam sem emenda.
const BAND_HEIGHT = "h-[340px] md:h-[300px] lg:h-[260px]";

// Faixa escura no topo que desce até cobrir o topo da primeira linha de cards;
// embaixo, o plano cinza. O topo (logo + busca, saudação + abas) fica preso ao
// rolar a partir de md — no celular ele ocuparia quase um terço da tela, então
// rola junto. A saudação é o ``PageHeader`` da página, desenhado aqui via
// portal (``PageHeaderSlotContext``). As abas ficam à direita da linha da
// saudação em lg+ e, abaixo de lg, numa linha própria acima dela.
export function AppLayout() {
    const { data } = useDashboardData();
    const [slot, setSlot] = useState<HTMLDivElement | null>(null);
    const scrolled = useScrolled();

    return (
        <div className="relative min-h-dvh">
            <div
                aria-hidden
                className={cn(
                    "bg-band absolute inset-x-0 top-0 overflow-hidden",
                    BAND_HEIGHT
                )}
            >
                <Waves />
            </div>

            <div
                className={cn(
                    "bg-band relative z-30 transition-shadow md:sticky md:top-0",
                    scrolled && "md:shadow-[0_10px_30px_rgb(0_0_0/0.18)]"
                )}
            >
                {/* ondas recortadas numa camada própria: o bloco não pode ter
                    overflow-hidden, senão corta a lista de resultados da busca */}
                <div aria-hidden className="absolute inset-0 overflow-hidden">
                    <div className={cn("absolute inset-x-0 top-0", BAND_HEIGHT)}>
                        <Waves />
                    </div>
                </div>

                <div className="relative mx-auto w-full max-w-[1200px] px-4 pb-8 sm:px-6 lg:px-8 lg:pb-10">
                    <header className="flex h-20 items-center justify-between gap-4">
                        {/* Brasão (brasao.png, recortado do logo antigo, sem fundo) +
                            divisor + "Analytics" em texto branco, imitando o logo:
                            o texto do PNG é escuro e sumiria na faixa. */}
                        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3 lg:gap-3.5">
                            <img
                                src={brasao}
                                alt=""
                                width={172}
                                height={207}
                                className="h-12 w-auto sm:h-14 lg:h-16"
                            />
                            <span
                                aria-hidden
                                className="h-6 w-px bg-white/70 sm:h-7 lg:h-7"
                            />
                            <span className="text-[17px] leading-none font-bold tracking-[-0.01em] text-white sm:text-[19px] lg:text-[21px]">
                                <span className="sr-only">UFC — PROGRAD </span>
                                Analytics
                            </span>
                            <span className="ml-1 sm:ml-2">
                                <ThemeToggle />
                            </span>
                        </div>
                        <CourseSearch cursos={data?.cursos ?? []} />
                    </header>

                    <div className="relative text-white">
                        <div className="mb-5 lg:absolute lg:top-6 lg:right-0 lg:mb-0">
                            <Sidebar />
                        </div>
                        <div ref={setSlot} />
                    </div>
                </div>
            </div>

            <div className="relative mx-auto w-full max-w-[1200px] px-4 pb-10 text-white sm:px-6 lg:px-8">
                <main className="min-w-0">
                    <PageHeaderSlotContext.Provider value={slot}>
                        <Outlet />
                    </PageHeaderSlotContext.Provider>
                </main>
            </div>
        </div>
    );
}

/** ``true`` depois que a página rolou — liga a sombra do topo fixo, que só
 * faz sentido quando há conteúdo passando por baixo dele. */
function useScrolled(): boolean {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return scrolled;
}

/** Linhas finas onduladas da faixa escura (decorativas), em dois feixes:
 * um saindo da esquerda e outro da direita, como no design de referência. */
function Waves() {
    const lines = Array.from({ length: 18 }, (_, i) => i);
    return (
        <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1440 380"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
        >
            <g stroke="white" strokeOpacity={0.07} strokeWidth={1}>
                {lines.map((i) => (
                    <path
                        key={`l${i}`}
                        d={`M -40 ${40 + i * 9} C 160 ${-20 + i * 6}, 300 ${260 + i * 4}, 620 ${300 + i * 7}`}
                    />
                ))}
                {lines.map((i) => (
                    <path
                        key={`r${i}`}
                        d={`M 900 ${-30 + i * 5} C 1100 ${120 + i * 8}, 1260 ${-10 + i * 6}, 1480 ${60 + i * 9}`}
                    />
                ))}
            </g>
        </svg>
    );
}
