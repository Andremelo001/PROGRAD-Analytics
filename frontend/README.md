# PROGRAD Analytics — Frontend

SPA React do PROGRAD Analytics: lê o `dashboard.json` gerado pelo
[backend](../backend/README.md) e mostra os indicadores da UFC Campus Quixadá.
Publicada no GitHub Pages como site estático, sem servidor.

**Todos os comandos `npm ...` deste README rodam de dentro de `frontend/`.**

---

## 1. Como rodar localmente

Pré-requisitos:

- **Node 22+** (com npm).
- O arquivo **`backend/app/data/processed/dashboard.json`**. Ele já vem
  versionado no repo; se não existir ou se você quiser dados novos, gere com o
  backend (`cd backend && poetry run python -m app.cmd all` — ver
  [`../backend/README.md`](../backend/README.md)).

```bash
# 1. Entrar no frontend
cd PROGRAD-Analytics/frontend

# 2. Instalar as dependências
npm install

# 3. Subir o servidor de desenvolvimento (http://localhost:5173)
npm run dev
```

`npm run dev` roda antes o `sync-data` (hook `predev`), que copia o
`dashboard.json` do backend para `public/data/`. Se o arquivo não existir, ele
para com uma mensagem dizendo qual comando do backend rodar.

Outros scripts:

```bash
npm run build      # sync-data + checagem de tipos (tsc -b) + build de produção em dist/
npm run preview    # serve o dist/ localmente (http://localhost:4173) pra conferir o build
npm run lint       # ESLint
npm run format     # Prettier (formata o projeto inteiro)
npm run sync-data  # só copia o dashboard.json de novo (ex.: depois de rodar o backend com o dev ligado)
```

---

## 2. Stack

| Ferramenta                                                                | Versão   | Uso                                                                |
| ------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| Node                                                                      | **22**   | runtime de build (mesma versão do CI)                              |
| React                                                                     | `^19.3`  | UI                                                                 |
| TypeScript                                                                | `^5.9`   | tipagem (limitado a 5.9 pelo `typescript-eslint`)                  |
| Vite                                                                      | `^8.3`   | dev server + build (`@vitejs/plugin-react`)                        |
| Tailwind CSS                                                              | `^4.3`   | estilos via `@tailwindcss/vite`, tokens em `@theme inline`         |
| `tw-animate-css` · `class-variance-authority` · `clsx` · `tailwind-merge` | —        | infraestrutura do shadcn/ui (`components.json`, helper `cn`)       |
| Recharts                                                                  | `^3.10`  | gráficos                                                           |
| lucide-react                                                              | `^1.48`  | ícones                                                             |
| React Router                                                              | `^7.18`  | rotas (`createHashRouter`, ver 5)                                  |
| `@fontsource-variable/plus-jakarta-sans`                                  | `^5.3`   | fonte Plus Jakarta Sans (variável) self-hosted                     |
| ESLint                                                                    | `^10.11` | lint (flat config, `react-hooks` + `react-refresh`)                |
| Prettier                                                                  | `^3.9`   | formatação (`printWidth` 88, plugin do Tailwind ordena as classes) |

---

## 3. Estrutura de pastas

```
frontend/
├── package.json · package-lock.json
├── vite.config.ts           # base do GitHub Pages + alias @ → src/
├── tsconfig.json · tsconfig.node.json
├── eslint.config.js · .prettierrc.json
├── components.json          # config do shadcn/ui
├── index.html               # favicon = src/assets/brasao.png
├── .gitignore
├── scripts/
│   ├── sync-data.mjs        # copia backend/.../dashboard.json → public/data/
│   └── build-brazil-dots.mjs # gera src/assets/brazil-dots.json (roda uma vez, ver 6)
├── public/
│   └── data/                # dashboard.json copiado (gitignored, gerado pelo sync-data)
├── designs_pages/           # imagem do design de referência (gitignored)
└── src/
    ├── main.tsx             # entrada: fonte + CSS + <App />
    ├── App.tsx              # DashboardDataProvider + RouterProvider
    ├── router.tsx           # rotas
    ├── index.css            # Tailwind + tokens de cor/fonte
    ├── assets/              # brasao.png (logo) · brazil-dots.json (mapa em pontos)
    ├── types/
    │   └── dashboard.ts     # tipos que espelham o dashboard.json
    ├── context/             # DashboardDataProvider (fetch único) · ThemeProvider (claro/escuro) · slot do PageHeader
    ├── hooks/               # useDashboardData · useTheme · useChartTheme (paleta dos gráficos do tema)
    ├── lib/
    │   ├── utils.ts         # cn()
    │   └── format.ts        # formatPercent, formatPoints, formatDecimal, formatInteger, toTitleCase, normalizeForSearch
    ├── components/
    │   ├── layout/          # AppLayout (faixa escura + header), Sidebar (abas), PageHeader, ThemeToggle, DataState
    │   ├── cards/           # Card, StatTile (taxa + sparkline)
    │   ├── charts/          # IngressantesTrendCard, CpcComparativoCard, BrasilMapaCard, EvasaoHeatmapCard,
    │   │                    # ChartMarks, ChartSelect, DataTable, chart-theme
    │   └── search/          # CourseSearch (busca de curso no header)
    └── pages/               # uma por rota (ver 5)
```

Critério das pastas: `components/` agrupa por papel (layout, card, gráfico,
busca), não por página; `pages/` só compõe componentes e escolhe que parte do
JSON mostrar. `src/assets/` é pra arquivos importados pelo código (ganham hash
no nome no build); `public/` é pra arquivos servidos como estão — por isso o
`dashboard.json` fica em `public/data/`.

---

## 4. Fluxo de dados

1. O backend gera `backend/app/data/processed/dashboard.json` (versionado).
2. `scripts/sync-data.mjs` copia para `frontend/public/data/dashboard.json` —
   roda sozinho antes de `dev` e `build` (`predev`/`prebuild`).
3. `DashboardDataProvider` (em `App.tsx`) faz **um único `fetch`** de
   `${import.meta.env.BASE_URL}data/dashboard.json` — o `BASE_URL` já inclui o
   prefixo do GitHub Pages no build de produção, então a mesma URL funciona em
   dev e em produção.
4. As páginas leem os dados com `useDashboardData()` (`{ data, loading, error }`)
   e usam `DataState` pra mostrar carregando/erro.

`types/dashboard.ts` espelha a estrutura do JSON (seções A-F, `fontes`,
`medias_nacionais` — descritas em [`../backend/README.md`](../backend/README.md),
seção 4.4). Se o backend mudar uma chave, esse arquivo muda junto.

Não há backend em runtime: o site é só HTML/JS/CSS + um JSON estático.

---

## 5. Rotas e páginas

| Rota                   | Página                                                                                                                                | Nas abas                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `/`                    | `HomePage` — visão geral do campus (ingressantes, taxas de conclusão/evasão, presença no Brasil, CPC x média, evasão anual por curso) | Início                                   |
| `/qualidade`           | `QualidadePage` (placeholder)                                                                                                         | Qualidade                                |
| `/trajetoria`          | `TrajetoriaPage` (placeholder)                                                                                                        | Trajetória                               |
| `/cursos/:codigoCurso` | `CursoDetalhePage` (placeholder) — aberta pela busca do header                                                                        | —                                        |
| `/campus`              | `CampusPage` (placeholder)                                                                                                            | — (rota existe, ainda fora da navegação) |
| `/configuracoes`       | `ConfiguracoesPage` (placeholder)                                                                                                     | Configurações                            |

O router é `createHashRouter` (URLs do tipo `/#/qualidade`) de propósito: o
GitHub Pages é hospedagem estática pura, e um refresh em
`/PROGRAD-Analytics/qualidade` daria 404 porque esse arquivo não existe no
servidor. Com hash, a rota nunca vai pro servidor.

---

## 6. Design

- **Referência**: a imagem em `designs_pages/` (gitignored). Faixa escura no
  topo com linhas onduladas finas, plano cinza-claro embaixo, cards brancos
  de cantos bem arredondados e sombra difusa, verde-limão como acento.
- **Header** (`AppLayout`): brasão da UFC + "Analytics" em texto branco à
  esquerda, só a busca à direita. Abaixo, a saudação (`PageHeader`) e as abas
  de navegação (`Sidebar` — o nome ficou do layout anterior, hoje são abas
  horizontais com sublinhado limão). A faixa escura desce até cobrir só o
  topo da primeira linha de cards. A partir de `md` (≥ 768px) esse topo
  inteiro — logo, busca, saudação e abas — fica preso ao rolar (os cards
  passam por baixo, com uma sombra); no celular ele rola junto, porque
  ocuparia quase um terço da tela. A saudação é o `PageHeader` da página,
  desenhado dentro do topo via portal (`context/page-header-slot.ts`).
- **Home** (`lg+`, grade de 12 colunas): linha 1 = Ingressantes (8) + taxas de
  conclusão e evasão empilhadas (4); linha 2 = Presença no Brasil (4) + CPC
  curso x média nacional (8); linha 3 = Evasão anual por curso — mapa de
  calor cursos × anos (12); o número do topo segue a célula sob o mouse. Abaixo de `lg` tudo vira uma coluna (as duas
  taxas ficam lado a lado em `sm`). Conferido em 1280, 900 e 390px de largura.
  Nenhum card muda de altura ao trocar o curso/turma nos seletores: legenda
  em linhas fixas, subtítulo e frases de contexto em uma linha só (truncam),
  botão do seletor na largura da opção mais longa.
- **Tema claro/escuro**: botão sol/lua à direita do logo (`ThemeToggle`). O
  `ThemeProvider` põe a classe `dark` no `<html>` e guarda a escolha no
  `localStorage` (`prograd-theme`); sem escolha salva, segue a preferência do
  sistema. Um script inline no `index.html` aplica o tema antes da primeira
  pintura (a página não "pisca" clara no modo escuro). A faixa do topo é
  escura nos dois temas; no escuro, o plano e os cards também escurecem.
- **Tokens** (`src/index.css`, expostos ao Tailwind via `@theme inline`,
  redefinidos no bloco `.dark`): `band`/`band-soft` (faixa escura e controles
  sobre ela), `page`, `surface`, `popover` (painéis que abrem por cima),
  `pill`/`pill-fg` (pílulas escuras e tooltips), `ink`, `lime` + `on-lime`
  (texto sobre o limão, escuro nos dois temas), `olive`/`olive-text`,
  `text-secondary`/`text-muted`, `empty` (contorno de célula sem dado),
  `card-ring` e `status-critical`/`status-critical-text`. Os tokens
  `primary`, `muted`, `card` etc. são do scaffolding do shadcn/ui. Cor nova
  entra aqui (nos dois temas), nunca como `bg-white`/hex solto no componente
  — exceção: `chart-theme.ts`, ver abaixo.
- **Fonte**: Plus Jakarta Sans (variável) como `--font-sans`, com
  `word-spacing` levemente aberto (o espaço da fonte é estreito).
- **Mapa do Brasil**: `src/assets/brazil-dots.json` é a malha de UFs do IBGE
  rasterizada numa grade de pontos (56 colunas). É versionado; pra gerar de
  novo (ex.: mudar a densidade), `node scripts/build-brazil-dots.mjs` — busca
  a malha na API do IBGE, então precisa de internet.

### Convenções dos gráficos

- Cores em hex em `chart-theme.ts` (atributos de SVG não resolvem
  `var(--...)` de forma confiável), numa paleta por tema (`CHART_LIGHT` /
  `CHART_DARK`, mesmas chaves) — os componentes pegam a do tema atual com
  `useChartTheme()`. Série principal em oliva, trecho fora de foco /
  referência em cinza; no mapa e no mapa de calor as rampas do escuro vão do
  escuro ao claro ("mais" = mais brilhante). Rampas validadas com o
  validador de paleta da skill dataviz contra o card de cada tema.
- Gráficos de linha (Ingressantes, CPC) seguem o design: ano em foco numa
  pílula limão no eixo, anel no ponto e etiqueta escura com o valor
  (`ChartMarks`); passar o mouse muda o foco. O seletor de série é o
  `ChartSelect`: pílula escura com lista própria (painel branco, ✓ na opção
  selecionada) — o `<select>` nativo abre no estilo do sistema e não aceita
  CSS.
- Série de referência (média nacional) sempre com legenda — nunca só a cor
  diferenciando as duas.
- Não há alternância gráfico/tabela na tela: cada gráfico tem uma
  `DataTable` dentro de um `sr-only`, pra leitor de tela ler os valores
  exatos.
- O SVG do Recharts é focável: sem contorno ao clicar, anel oliva só no foco
  por teclado (`index.css`).
- Cor de status nunca aparece sozinha: sempre com seta ou texto junto.
- Números formatados em pt-BR pelos helpers de `lib/format.ts`.

---

## 7. Deploy (GitHub Pages)

Workflow em `.github/workflows/deploy-frontend.yml` (na raiz do repo). Roda em
push na `main` que mexa em `frontend/**`, no `dashboard.json` ou no próprio
workflow (ou manualmente, via _workflow_dispatch_):

1. `npm ci` → `npm run sync-data` → `npm run build` com `GITHUB_PAGES=true`.
2. Com essa variável, o `vite.config.ts` usa `base: "/PROGRAD-Analytics/"`
   (site publicado em `https://andremelo001.github.io/PROGRAD-Analytics/`).
   Localmente ela não é setada e o `base` fica `/`.
3. Publica `frontend/dist` no GitHub Pages.

Ou seja: pra atualizar os dados do site, basta rodar o backend, commitar o
`dashboard.json` novo e dar push — o deploy sai sozinho.

No repositório, **Settings → Pages → Source** precisa estar em
**GitHub Actions**.

---

## 8. Pontos conhecidos

- O bundle JS passa de 500 KB (o Vite avisa no build), quase todo pelo
  Recharts. Resolver com code-splitting por rota (`lazy`) quando houver mais
  páginas.
- A rota `/campus` existe, mas ainda não está nas abas.
- Qualidade, Trajetória, Curso e Configurações ainda são placeholders.
- O CPC de cada curso tem no máximo 2 avaliações nos dados atuais (ciclos do
  Enade, 2020 adiado), então o gráfico de CPC tem poucos pontos por curso.
