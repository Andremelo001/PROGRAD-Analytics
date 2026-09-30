import { Presentation } from "lucide-react";

/** Entra no modo apresentação (só os cards na tela). Fica ao lado do botão de
 * tema, sobre a faixa escura, no mesmo estilo dele. Atalho: Ctrl+K / ⌘+K. */
export function PresentationToggle({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Entrar no modo apresentação"
            aria-keyshortcuts="Control+K Meta+K"
            title="Modo apresentação (Ctrl+K)"
            className="bg-band-soft focus-visible:ring-lime/60 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-white transition-colors outline-none hover:border-white/25 focus-visible:ring-2 sm:h-9 sm:w-9"
        >
            <Presentation size={16} strokeWidth={2} aria-hidden />
        </button>
    );
}
