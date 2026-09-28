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
| `@fontsource/jaldi`                                                       | `^5.3`   | fonte Jaldi self-hosted (só subset latin, pesos 400/700)           |
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
├── index.html               # favicon = src/assets/logo.png
├── .gitignore
├── scripts/
│   └── sync-data.mjs        # copia backend/.../dashboard.json → public/data/
├── public/
│   └── data/                # dashboard.json copiado (gitignored, gerado pelo sync-data)
├── designs_pages/           # PNGs exportados do Figma, referência de layout (gitignored)
└── src/
    ├── main.tsx             # entrada: fonte Jaldi + CSS + RouterProvider
    ├── App.tsx
    ├── router.tsx           # rotas
    ├── index.css            # Tailwind + tokens de cor/fonte
    ├── assets/              # logo.png (importado pelo código, passa pelo bundler)
    ├── types/
    │   └── dashboard.ts     # tipos que espelham o dashboard.json
    ├── context/             # DashboardDataProvider (fetch único) + contexto
    ├── hooks/               # useDashboardData
    ├── lib/
    │   ├── utils.ts         # cn()
    │   └── format.ts        # formatPercent, formatPoints, formatInteger, formatDate, toTitleCase, normalizeForSearch
    ├── components/
    │   ├── layout/          # AppLayout, Sidebar (pílula de ícones), PageHeader, DataState (loading/erro)
    │   ├── cards/           # Card, StatTile, AlertsCard
    │   ├── charts/          # chart-theme, ChartTooltip, ViewToggle (+DataTable), CpcFaixaCard, IngressantesTrendCard, CpcComparativoCard
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
3. `DashboardDataProvider` (em `AppLayout`) faz **um único `fetch`** de
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

| Rota                   | Página                                                                                                              | Na sidebar                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `/`                    | `HomePage` — visão geral do campus (KPIs, alertas, ingressantes por ano, faixas de CPC, CPC curso x média nacional) | Início                                   |
| `/qualidade`           | `QualidadePage`                                                                                                     | Qualidade                                |
| `/trajetoria`          | `TrajetoriaPage`                                                                                                    | Trajetória                               |
| `/cursos/:codigoCurso` | `CursoDetalhePage` — aberta pela busca do header                                                                    | —                                        |
| `/campus`              | `CampusPage`                                                                                                        | — (rota existe, ainda fora da navegação) |
| `/configuracoes`       | `ConfiguracoesPage`                                                                                                 | Configurações (rodapé da sidebar)        |

O router é `createHashRouter` (URLs do tipo `/#/qualidade`) de propósito: o
GitHub Pages é hospedagem estática pura, e um refresh em
`/PROGRAD-Analytics/qualidade` daria 404 porque esse arquivo não existe no
servidor. Com hash, a rota nunca vai pro servidor.

---

## 6. Design

- **Referência**: as imagens em `designs_pages/`. Visual compacto e
  minimalista: logo em branco direto sobre o fundo, no canto, navegação numa pílula estreita,
  cards brancos com raio de 16px sobre o fundo `brand`.
- **Sem scroll no desktop**: em `lg+` (≥ 1024px) o layout ocupa exatamente
  `100dvh` — header da página com a mesma altura do bloco do logo (64px) e a
  grade da Home preenchendo o resto: 3 colunas × 2 linhas. Linha 1 = cards
  pequenos (taxa de conclusão, taxa de evasão, alertas), na altura dos stat
  tiles — o de alertas não estica a linha e rola por dentro se tiver muitos
  itens; linha 2 = gráficos (ingressantes por ano, cursos por faixa de CPC,
  CPC curso x média nacional) com o que sobra. Abaixo de `lg`: 2 colunas
  (`md`) ou 1, e a página rola, com a sidebar presa na altura da tela.
  Conferido em 1920×1080, 1440×900, 1366×768, 1280×720, 1024×768 e 390×844.
- **Tokens** (`src/index.css`, expostos ao Tailwind via `@theme inline`):
  `brand` `#016bae` (fundo, item ativo, série dos gráficos), `ink`, `icon`,
  `text-secondary`/`text-muted`, `chart-grid`/`chart-axis` e
  `status-good`/`status-warning`/`status-critical`. Cor nova entra aqui, não
  como hex solto no componente.
- **Fonte**: Jaldi (400/700) como `--font-sans`.
- **Sidebar**: pílula de 64px só com ícones lucide (`House`, `Award`, `Route`,
  `Settings`, 22px); item ativo num círculo `brand`; o nome da aba aparece no
  tooltip e no `aria-label`.

### Convenções dos gráficos

- Série principal na cor `brand`, linha de 2px, área com 10% de opacidade e
  ponto final destacado; grade em linha fina (`chart-theme.ts` centraliza isso).
- Série de referência (média nacional) em cinza tracejado, com legenda — nunca
  só a cor diferenciando as duas.
- Todo gráfico tem tooltip (`ChartTooltip`) e alternância **Gráfico/Tabela**
  (`ViewToggle` + `DataTable`), pra leitura acessível dos valores exatos.
- Cor de status nunca aparece sozinha: sempre com ícone + rótulo.
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
- A rota `/campus` existe, mas ainda não está na sidebar.
