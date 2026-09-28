import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

interface NavItem {
    to: string;
    label: string;
    end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { to: "/", label: "Início", end: true },
    { to: "/qualidade", label: "Qualidade" },
    { to: "/trajetoria", label: "Trajetória" },
    { to: "/configuracoes", label: "Configurações" },
];

/** Navegação principal em abas sobre a faixa escura: texto claro, a aba
 * ativa em branco com sublinhado limão sobre uma hairline contínua. Rola na
 * horizontal em telas estreitas. */
export function Sidebar() {
    return (
        <nav
            aria-label="Navegação principal"
            className="-mx-1 [scrollbar-width:none] overflow-x-auto"
        >
            <ul className="flex min-w-max border-b border-white/15 px-1">
                {NAV_ITEMS.map(({ to, label, end }) => (
                    <li key={to}>
                        <NavLink
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                cn(
                                    "relative -mb-px block border-b-2 px-3.5 pb-3 text-[15px] transition-colors outline-none focus-visible:text-white sm:px-5",
                                    isActive
                                        ? "border-lime font-semibold text-white"
                                        : "border-transparent text-white/50 hover:text-white/80"
                                )
                            }
                        >
                            {label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
