import { Outlet } from "react-router-dom";

import logo from "@/assets/logo.png";
import { Sidebar } from "@/components/layout/Sidebar";

// Coluna estreita à esquerda (logo + pílula de navegação) e a página à direita.
// Em lg+ tudo cabe na altura da tela, sem scroll da página: o logo tem a mesma
// altura do header da página (h-16) e o mesmo gap, então a sidebar começa
// alinhada com a primeira linha de cards. Abaixo de lg o conteúdo rola.
export function AppLayout() {
    return (
        <div className="bg-brand flex min-h-dvh gap-4 p-4 lg:h-dvh lg:min-h-[640px] lg:gap-5 lg:p-5">
            {/* Abaixo de lg a página rola: a coluna fica presa na altura da tela
                pra configurações não ir parar no fim da página. */}
            <div className="sticky top-4 flex h-[calc(100dvh-2rem)] w-16 shrink-0 flex-col gap-4 self-start lg:static lg:h-auto lg:gap-5 lg:self-stretch">
                <div className="flex h-16 shrink-0 items-center justify-center">
                    {/* Só o logo, direto sobre o fundo, em branco (o original é
                        azul-escuro e some no fundo brand). O PNG tem respiro
                        transparente em volta do desenho, por isso é maior que o
                        espaço (84px num bloco de 64px) — o desenho em si cabe. */}
                    <img
                        src={logo}
                        alt="UFC — PROGRAD Analytics"
                        width={122}
                        height={122}
                        className="h-[84px] w-[84px] max-w-none brightness-0 invert"
                    />
                </div>
                <Sidebar />
            </div>
            <main className="flex min-w-0 flex-1 flex-col lg:min-h-0">
                <Outlet />
            </main>
        </div>
    );
}
