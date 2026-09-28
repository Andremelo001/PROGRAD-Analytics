import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes condicionais e resolve conflitos de utilitário do Tailwind
 * (ex.: `cn("p-2", condition && "p-4")` fica só com `p-4` quando `condition`
 * é verdadeiro) — usado por todo componente shadcn/ui. */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
