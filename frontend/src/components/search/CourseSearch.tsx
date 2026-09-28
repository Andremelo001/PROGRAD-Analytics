import { Search } from "lucide-react";
import { useId, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { normalizeForSearch, toTitleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Curso } from "@/types/dashboard";

const MAX_RESULTS = 6;

/** Pílula de busca do header: procura cursos do escopo pelo nome e leva pra
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
            className="relative h-12 w-full shrink-0 lg:w-[340px]"
        >
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
                className="text-ink placeholder:text-text-muted h-full w-full rounded-full bg-white pr-14 pl-5 text-base outline-none focus-visible:ring-4 focus-visible:ring-white/40 [&::-webkit-search-cancel-button]:hidden"
            />
            <button
                type="submit"
                aria-label="Buscar"
                className="bg-brand absolute top-1 right-1 flex h-10 w-10 items-center justify-center rounded-full text-white"
            >
                <Search size={18} strokeWidth={2} aria-hidden />
            </button>

            {showList && (
                <ul
                    id={listId}
                    role="listbox"
                    className="text-ink absolute top-[calc(100%+8px)] right-0 left-0 z-20 overflow-hidden rounded-2xl bg-white py-1.5 shadow-lg"
                >
                    {results.length === 0 ? (
                        <li className="text-text-secondary px-5 py-2.5 text-[15px]">
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
                                    "cursor-pointer px-5 py-2 text-[15px]",
                                    index === active && "bg-brand/10"
                                )}
                            >
                                {toTitleCase(curso.nome_curso)}
                                {curso.grau_academico && (
                                    <span className="text-text-muted ml-2 text-xs">
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
