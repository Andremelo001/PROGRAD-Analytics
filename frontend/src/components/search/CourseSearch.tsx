import { Search } from "lucide-react";
import { useId, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { normalizeForSearch, toTitleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Curso } from "@/types/dashboard";

const MAX_RESULTS = 6;

/** Pílula de busca da faixa escura: procura cursos do escopo pelo nome e leva pra
 * página de detalhe do curso. */
export function CourseSearch({ cursos }: { cursos: Curso[] }) {
    const navigate = useNavigate();
    const listId = useId();
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);

    const results = useMemo(() => {
        const needle = normalizeForSearch(query);
        if (!needle) return [];
        return cursos
            .filter((curso) => normalizeForSearch(curso.nome_curso).includes(needle))
            .slice(0, MAX_RESULTS);
    }, [cursos, query]);

    const showList = open && query.trim().length > 0;

    function go(curso: Curso | undefined) {
        if (!curso) return;
        setQuery("");
        setOpen(false);
        navigate(`/cursos/${curso.codigo_curso}`);
    }

    function onSubmit(event: FormEvent) {
        event.preventDefault();
        go(results[active] ?? results[0]);
    }

    function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (!showList || results.length === 0) return;
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => (index + 1) % results.length);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => (index - 1 + results.length) % results.length);
        } else if (event.key === "Escape") {
            setOpen(false);
        }
    }

    return (
        <form
            role="search"
            onSubmit={onSubmit}
            className="relative h-11 w-full max-w-[360px] min-w-0"
        >
            <Search
                size={17}
                strokeWidth={2}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-white/50"
            />
            <input
                type="search"
                value={query}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setActive(0);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={onKeyDown}
                placeholder="Pesquisar curso..."
                aria-label="Pesquisar curso"
                role="combobox"
                aria-expanded={showList}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                    showList && results.length > 0 ? `${listId}-${active}` : undefined
                }
                className="bg-band-soft focus-visible:ring-lime/40 h-full w-full rounded-full border border-white/10 pr-4 pl-11 text-[13px] text-white outline-none placeholder:text-white/45 focus-visible:ring-2 [&::-webkit-search-cancel-button]:hidden"
            />

            {showList && (
                <ul
                    id={listId}
                    role="listbox"
                    className="text-ink absolute top-[calc(100%+8px)] right-0 left-0 z-30 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_16px_40px_rgb(0_0_0/0.18)]"
                >
                    {results.length === 0 ? (
                        <li className="text-text-secondary px-3 py-2 text-[13px]">
                            Nenhum curso encontrado
                        </li>
                    ) : (
                        results.map((curso, index) => (
                            <li
                                key={curso.codigo_curso}
                                id={`${listId}-${index}`}
                                role="option"
                                aria-selected={index === active}
                                // mousedown (não click): dispara antes do blur do input
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                    go(curso);
                                }}
                                onMouseEnter={() => setActive(index)}
                                className={cn(
                                    "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-[13px]",
                                    index === active && "bg-page"
                                )}
                            >
                                {toTitleCase(curso.nome_curso)}
                                {curso.grau_academico && (
                                    <span className="text-text-muted text-[11px]">
                                        {curso.grau_academico}
                                    </span>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </form>
    );
}
