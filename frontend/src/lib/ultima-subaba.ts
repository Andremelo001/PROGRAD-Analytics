/** Última sub-aba aberta na Qualidade (caminho com a busca, ex.:
 * ``/qualidade/curso/123`` ou ``/qualidade/comparacoes?modo=cursos``): ao
 * voltar pra aba (o link do menu aponta pra ``/qualidade``), o painel reabre
 * onde estava em vez de cair sempre na Visão do campus. Só na memória da
 * página: recarregar começa de novo pela Visão do campus. */
let ultima: string | null = null;

export function lembrarSubaba(caminho: string) {
    ultima = caminho;
}

export function ultimaSubaba(): string {
    return ultima ?? "/qualidade/campus";
}
