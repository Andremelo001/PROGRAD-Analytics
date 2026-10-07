/** Deixa ``item`` visível rolando só a ``lista`` (o ``scrollIntoView`` rola
 * também os ancestrais, inclusive a faixa do topo). */
export function rolarDentro(lista: HTMLElement | null, item: HTMLElement | null) {
    if (!lista || !item) return;
    const topo = item.offsetTop;
    const fim = topo + item.offsetHeight;
    if (topo < lista.scrollTop) lista.scrollTop = topo;
    else if (fim > lista.scrollTop + lista.clientHeight)
        lista.scrollTop = fim - lista.clientHeight;
}
