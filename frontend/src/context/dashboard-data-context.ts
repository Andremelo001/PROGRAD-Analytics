import { createContext } from "react";

import type { CampusInfo, DashboardData } from "@/types/dashboard";

export interface DashboardDataContextValue {
    /** Dados do campus selecionado (durante a troca, os do anterior). */
    data: DashboardData | null;
    /** Só a primeira carga — na troca de campus os dados antigos seguem na tela. */
    loading: boolean;
    error: string | null;
    /** Campi disponíveis (index.json). */
    campi: CampusInfo[];
    /** Slug do campus selecionado. */
    campus: string | null;
    setCampus: (slug: string) => void;
    /** ``true`` enquanto baixa o JSON de um campus recém-escolhido. */
    switching: boolean;
    /** Campus ao abrir o painel (Configurações): ``ULTIMO_CAMPUS`` (o último
     * escolhido) ou o slug de um campus fixo. */
    campusAoAbrir: string;
    setCampusAoAbrir: (valor: string) => void;
}

/** Valor de ``campusAoAbrir`` que abre no último campus escolhido (padrão). */
export const ULTIMO_CAMPUS = "ultimo";

export const DashboardDataContext = createContext<
    DashboardDataContextValue | undefined
>(undefined);
