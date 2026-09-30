# PROGRAD Analytics — Frontend

SPA React do PROGRAD Analytics: lê os JSONs do painel gerados pelo
[backend](../backend/README.md) — um por campus da UFC — e mostra os
indicadores do campus escolhido no seletor da saudação (padrão: Quixadá).
Publicada no GitHub Pages como site estático, sem servidor.

**Todos os comandos `npm ...` deste README rodam de dentro de `frontend/`.**

---

## 1. Como rodar localmente

Pré-requisitos:

- **Node 22+** (com npm).
- A pasta **`backend/app/data/processed/dashboard/`** (`index.json` + um JSON
  por campus). Ela já vem versionada no repo; se não existir ou se você quiser dados novos, gere com o
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

`npm run dev` roda antes o `sync-data` (hook `predev`), que copia a pasta
`dashboard/` do backend para `public/data/dashboard/`. Se o `index.json` não
existir, ele para com uma mensagem dizendo qual comando do backend rodar.

Outros scripts:

```bash
npm run build      # sync-data + checagem de tipos (tsc -b) + build de produção em dist/
npm run preview    # serve o dist/ localmente (http://localhost:4173) pra conferir o build
npm run lint       # ESLint
npm run format     # Prettier (formata o projeto inteiro)
npm run sync-data  # só copia os JSONs dos campi de novo (ex.: depois de rodar o backend com o dev ligado)
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
│   ├── sync-data.mjs        # copia backend/.../dashboard/ → public/data/dashboard/
│   └── build-brazil-dots.mjs # gera src/assets/brazil-dots.json (roda uma vez, ver 6)
├── public/
│   └── data/dashboard/      # index.json + JSON de cada campus (gitignored, gerado pelo sync-data)
├── designs_pages/           # imagem do design de referência (gitignored)
└── src/
    ├── main.tsx             # entrada: fonte + CSS + <App />
    ├── App.tsx              # DashboardDataProvider + RouterProvider
    ├── router.tsx           # rotas
    ├── index.css            # Tailwind + tokens de cor/fonte
    ├── assets/              # brasao.png (logo) · brazil-dots.json (mapa em pontos)
    ├── types/
    │   └── dashboard.ts     # tipos que espelham o dashboard.json
    ├── context/             # DashboardDataProvider (índice + campus escolhido) · ThemeProvider (claro/escuro) · slot do PageHeader
    ├── hooks/               # useDashboardData · useTheme · useChartTheme (paleta dos gráficos do tema) · useMediaQuery · usePresentationMode
    ├── lib/
    │   ├── utils.ts         # cn()
    │   └── format.ts        # formatPercent, formatPoints, formatDecimal, formatInteger, toTitleCase, normalizeForSearch
    ├── components/
    │   ├── layout/          # AppLayout (faixa escura + header), Sidebar (abas), PageHeader, ThemeToggle, PresentationToggle, CampusSelect, DataState
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
JSONs dos campi ficam em `public/data/dashboard/`.

---

## 4. Fluxo de dados

1. O backend gera `backend/app/data/processed/dashboard/<campus>.json`
   (versionados), um por campus, todos com a mesma estrutura.
   Junto vai um `index.json` com a lista de campi (`slug`, `nome`,
   `total_cursos`, `arquivo`).
2. `scripts/sync-data.mjs` copia a pasta inteira para
   `frontend/public/data/dashboard/` — roda sozinho antes de `dev` e `build`
   (`predev`/`prebuild`).
3. `DashboardDataProvider` (em `App.tsx`) busca o `index.json` e o JSON do
   campus escolhido, em `${import.meta.env.BASE_URL}data/dashboard/` — o
   `BASE_URL` já inclui o prefixo do GitHub Pages no build de produção. O
   campus inicial é o último escolhido (`localStorage`, chave
   `prograd-campus`), senão Quixadá. JSONs já baixados ficam em cache.
4. O seletor de campus (`CampusSelect`, dentro da frase da saudação) troca o
   campus; os dados antigos seguem na tela até os novos chegarem (a seta do
   seletor vira um indicador de carga) e os cards da Home remontam — cursos e
   focos escolhidos voltam ao padrão do novo campus.
5. As páginas leem os dados com `useDashboardData()` (`{ data, loading, error,
campi, campus, setCampus, switching }`) e usam `DataState` pra mostrar
   carregando/erro.

`types/dashboard.ts` espelha a estrutura do JSON (seções A-F, `fontes`,
`medias_nacionais` — descritas em [`../backend/README.md`](../backend/README.md),
seção 4.4). Se o backend mudar uma chave, esse arquivo muda junto.

Não há backend em runtime: o site é só HTML/JS/CSS + JSONs estáticos. O de
Fortaleza (~100 cursos) passa de 7 MB — é baixado só quando escolhido.

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
  topo da primeira linha de cards. Esse topo fica preso ao rolar (os cards passam por baixo, com uma sombra):
  em `lg+` inteiro — logo, busca, saudação e abas, que dividem a mesma linha;
  abaixo de `lg` só até as abas, e a saudação rola com a página (fixa, ela
  tomaria quase um terço da tela do celular). A saudação é o `PageHeader` da
  página, desenhado via portal (`context/page-header-slot.ts`) no slot de
  dentro do topo fixo (`lg+`) ou no de logo abaixo dele (telas menores,
  escolhido com `useMediaQuery`).
- **Modo apresentação**: botão ao lado do sol/lua (`PresentationToggle`, a
  partir de `sm` — no celular o cabeçalho não tem largura pra ele), atalho
  **Ctrl+K** / **⌘+K** pra entrar e sair, **Esc** pra sair. A faixa escura e
  o topo sobem até sumir e os cards sobem junto (0,5s; sem animação com
  "reduzir movimento"), até a altura do X no desktop; o navegador entra em
  tela cheia depois da animação (e, ao sair, só sai da tela cheia depois de
  a faixa voltar), só a partir de 1024px de largura (em
  celular e tablet o modo funciona sem ela; sair da tela cheia pelo
  navegador também sai do modo). Um X no
  canto superior esquerdo sai do modo. O topo
  escondido fica `inert` (o Tab não passa por ele). Estado e atalhos em
  `hooks/usePresentationMode.ts`; a animação em `AppLayout`.
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
  referência em cinza. No mapa do Brasil, do mais claro (poucos cursos) ao
  mais escuro (muitos), nos dois temas. No mapa de calor, a cor é a
  diferença para a média nacional da área: verde abaixo, vermelho acima,
  mais escuro quanto maior a distância — cada lado com a sua amplitude
  (múltiplo de 5 p.p.), mostrada na legenda.
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
push na `main` que mexa em `frontend/**`, nos JSONs de
`backend/app/data/processed/dashboard/` ou no próprio
workflow (ou manualmente, via _workflow_dispatch_):

1. `npm ci` → `npm run sync-data` → `npm run build` com `GITHUB_PAGES=true`.
2. Com essa variável, o `vite.config.ts` usa `base: "/PROGRAD-Analytics/"`
   (site publicado em `https://andremelo001.github.io/PROGRAD-Analytics/`).
   Localmente ela não é setada e o `base` fica `/`.
3. Publica `frontend/dist` no GitHub Pages.

Ou seja: pra atualizar os dados do site, basta rodar o backend, commitar os
JSONs novos de `dashboard/` e dar push — o deploy sai sozinho.

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
