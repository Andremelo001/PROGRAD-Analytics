import { createContext } from "react";

/** Elemento dentro do topo fixo do ``AppLayout`` onde o ``PageHeader`` da
 * página é desenhado (via portal) — assim a saudação fica presa junto com o
 * logo, a busca e as abas. ``null`` enquanto o layout não montou. */
export const PageHeaderSlotContext = createContext<HTMLElement | null>(null);
