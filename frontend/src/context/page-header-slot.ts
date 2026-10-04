import { createContext } from "react";

/** Elemento dentro do topo fixo do ``AppLayout`` onde o ``PageHeader`` da
 * página é desenhado (via portal) — assim a saudação fica presa junto com o
 * logo, a busca e as abas. ``null`` enquanto o layout não montou. */
export const PageHeaderSlotContext = createContext<HTMLElement | null>(null);

/** Elemento logo abaixo da barra do modo apresentação, onde o ``PageHeader``
 * desenha de novo as sub-abas (``tabs``): a faixa escura, com a versão
 * normal delas, some no modo apresentação. Fora dele, o lugar fica recolhido
 * e inerte. */
export const PresentationTabsSlotContext = createContext<HTMLElement | null>(null);
