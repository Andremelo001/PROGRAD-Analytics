import { Award, House, Route, Settings, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    end?: boolean;
}

const MAIN_ITEMS: NavItem[] = [
    { to: "/", label: "Início", icon: House, end: true },
    { to: "/qualidade", label: "Qualidade", icon: Award },
    { to: "/trajetoria", label: "Trajetória", icon: Route },
];

const SETTINGS_ITEM: NavItem = {
    to: "/configuracoes",
    label: "Configurações",
    icon: Settings,
};

/** Pílula de navegação só com ícones; o nome da aba aparece no tooltip
 * (``title``) e é lido por leitor de tela (``aria-label``). Configurações fica
 * no rodapé, separada das abas de conteúdo. */
export function Sidebar() {
    return (
        <aside className="flex min-h-0 flex-1 flex-col items-center rounded-full bg-white py-3">
            <nav aria-label="Navegação principal" className="flex flex-col gap-3">
                {MAIN_ITEMS.map((item) => (
                    <SidebarLink key={item.to} item={item} />
                ))}
            </nav>
            <div className="mt-auto pt-3">
                <SidebarLink item={SETTINGS_ITEM} />
            </div>
        </aside>
    );
}

function SidebarLink({ item }: { item: NavItem }) {
    const { to, label, icon: Icon, end } = item;
    return (
        <NavLink
            to={to}
            end={end}
            aria-label={label}
            title={label}
            className={({ isActive }) =>
                cn(
                    "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                    isActive ? "bg-brand text-white" : "text-icon hover:bg-brand/10"
                )
            }
        >
            <Icon size={22} strokeWidth={1.75} aria-hidden />
        </NavLink>
    );
}
