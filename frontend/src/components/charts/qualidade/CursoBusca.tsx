import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { normalizeForSearch } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface OpcaoCurso {
    value: string;
    label: string;
    /** Segunda linha (instituição, cidade, CPC…). */
    detalhe?: string;
}

/** Quantas opções a lista mostra de uma vez (com 1.800 cursos numa área, a
 * busca é que leva ao curso). */
const MAX_VISIVEIS = 60;

/** Seletor com busca (combobox) pra listas longas — os cursos de uma área no
 * Brasil inteiro. Fechado, mostra o escolhido (com um ponto da cor da série);
 * aberto, um campo de busca que filtra por nome e detalhe, sem acento.
 * Teclado: ↑/↓, Enter, Esc. */
export function CursoBusca({
    label,
    cor,
    value,
    options,
    onChange,
    placeholder = "Buscar…",
}: {
    label: string;
    cor: string;
    value: string | null;
    options: OpcaoCurso[];
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const id = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [busca, setBusca] = useState("");
    const [ativo, setAtivo] = useState(0);

    const selecionado = options.find((o) => o.value === value);
    const correspondentes = useMemo(() => {
        const termo = normalizeForSearch(busca);
        return termo
            ? options.filter((o) =>
                  normalizeForSearch(`${o.label} ${o.detalhe ?? ""}`).includes(termo)
              )
            : options;
    }, [options, busca]);
    const filtradas = correspondentes.slice(0, MAX_VISIVEIS);
    const total = correspondentes.length;

    useEffect(() => {
        if (!open) return;
        inputRef.current?.focus();
        const fora = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("pointerdown", fora);
        return () => document.removeEventListener("pointerdown", fora);
    }, [open]);

    useEffect(() => {
        if (open)
            document
                .getElementById(`${id}-${ativo}`)
                ?.scrollIntoView({ block: "nearest" });
    });

    function escolher(i: number) {
        const o = filtradas[i];
        if (o) onChange(o.value);
        setOpen(false);
        setBusca("");
    }

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setAtivo((i) => Math.min(i + 1, filtradas.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setAtivo((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            escolher(ativo);
        } else if (e.key === "Escape") {
            setOpen(false);
            setBusca("");
        }
    }

    return (
        <div ref={rootRef} className="relative min-w-0">
            {open ? (
                <div className="bg-page ring-lime/60 flex h-10 items-center gap-2 rounded-xl px-3 ring-2">
                    <Search
                        size={15}
                        className="text-text-muted shrink-0"
                        aria-hidden
                    />
                    <input
                        ref={inputRef}
                        role="combobox"
                        aria-expanded
                        aria-controls={`${id}-lista`}
                        aria-activedescendant={
                            filtradas.length ? `${id}-${ativo}` : undefined
                        }
                        aria-label={label}
                        value={busca}
                        placeholder={placeholder}
                        onChange={(e) => {
                            setBusca(e.target.value);
                            setAtivo(0);
                        }}
                        onKeyDown={onKeyDown}
                        className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                    />
                </div>
            ) : (
                <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-label={`${label}: ${selecionado?.label ?? "nenhum"}`}
                    onClick={() => {
                        setAtivo(0);
                        setOpen(true);
                    }}
                    className="bg-page hover:bg-page/70 focus-visible:ring-lime/60 flex h-10 w-full min-w-0 items-center gap-2.5 rounded-xl px-3 text-left outline-none focus-visible:ring-2"
                >
                    <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: cor }}
                    />
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold">
                            {selecionado?.label ?? placeholder}
                        </span>
                    </span>
                    <ChevronDown
                        size={15}
                        className="text-text-muted shrink-0"
                        aria-hidden
                    />
                </button>
            )}

            {open && (
                <ul
                    id={`${id}-lista`}
                    role="listbox"
                    aria-label={label}
                    className="bg-popover text-ink absolute top-[calc(100%+6px)] right-0 left-0 z-40 max-h-80 overflow-y-auto rounded-xl p-1.5 shadow-[0_16px_40px_rgb(0_0_0/0.18)]"
                >
                    {filtradas.length === 0 && (
                        <li className="text-text-secondary px-3 py-2 text-[13px]">
                            Nenhum curso encontrado
                        </li>
                    )}
                    {filtradas.map((o, i) => (
                        <li
                            key={o.value}
                            id={`${id}-${i}`}
                            role="option"
                            aria-selected={o.value === value}
                            onPointerEnter={() => setAtivo(i)}
                            onPointerDown={(e) => e.preventDefault()}
                            onClick={() => escolher(i)}
                            className={cn(
                                "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2",
                                i === ativo && "bg-page"
                            )}
                        >
                            <span className="min-w-0">
                                <span
                                    className={cn(
                                        "block truncate text-[13px]",
                                        o.value === value && "font-semibold"
                                    )}
                                >
                                    {o.label}
                                </span>
                                {o.detalhe && (
                                    <span className="text-text-muted block truncate text-[11px]">
                                        {o.detalhe}
                                    </span>
                                )}
                            </span>
                            <Check
                                size={15}
                                strokeWidth={2.5}
                                aria-hidden
                                className={cn(
                                    "text-olive-text shrink-0",
                                    o.value !== value && "invisible"
                                )}
                            />
                        </li>
                    ))}
                    {total > filtradas.length && (
                        <li className="text-text-muted px-3 py-2 text-[11px]">
                            Mostrando {filtradas.length} de {total}: digite para refinar
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
