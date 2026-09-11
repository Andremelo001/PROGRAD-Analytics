# PROGRAD Analytics

Projeto de análise de dados da PROGRAD. Este arquivo documenta o setup do
ambiente e a estrutura de pastas.

---

## 1. Ferramentas e versões

| Ferramenta | Versão |
|---|---|
| Python | **3.12.3** |
| Poetry | **2.3.4** |

### Dependências de runtime

| Pacote | Uso |
|---|---|
| `pydantic-settings` · `pydantic` | `core/config/settings.py`, schemas dos módulos |
| `loguru` | `core/config/log.py` — logging |
| `pandas` · `python-calamine` | leitura das planilhas (`.xlsx` / `.xls`) e transformação |
| `httpx` · `certifi` | download dos arquivos do INEP (paralelo, ver `InepClient.download_many`) |
| `beautifulsoup4` · `lxml` | scraping das abas por ano no portal do INEP |

`python-calamine` (Rust) substitui `openpyxl`/`xlrd` na leitura — 3-6x mais rápido,
mesmo comportamento nos dois formatos.

### Dependências de desenvolvimento

| Pacote | Restrição |
|---|---|
| `ruff` | `^0.5.0` |
| `mypy` | `^1.10.1` |
| `black` | `^24.4.2` |
| `pre-commit` | `^3.7.1` |
| `import-linter` | `^2.11` |
| `pytest` · `pytest-cov` | testes |
| `openpyxl` | só para gerar fixtures `.xlsx` nos testes (não é usado em runtime) |

`[tool.mypy]` usa `plugins = ["pydantic.mypy"]`.

---

### 2. Estrutura de pastas

```
app/
├── cmd/
│   └── __main__.py          # CLI: python -m app.cmd <qualidade|trajetoria|dashboard|all>
├── core/
│   ├── config/              # settings.py + log.py
│   ├── domain/
│   │   ├── normalization.py # normalize_key (casa cabeçalho x "Nome Original")
│   │   ├── interfaces/      # Protocols: DataSource, Reader, Transformer, Exporter
│   │   ├── pipelines/       # DataPipeline, SpecTransformer, model_to_specs, ModuleReport
│   │   └── value_objects/   # RawFile, ColumnSpec
│   └── infrastructure/
│       ├── http/            # InepClient (httpx + retry) + certs/inep_ca_chain.pem
│       ├── scraping/        # govbr_tabs: landing → abas → links de arquivo
│       ├── readers/         # SpreadsheetReader (.xlsx / .xls)
│       └── storage/         # CsvExporter, JsonExporter, MetaWriter, dataset_locator
├── data/
│   ├── raw/                 # baixados brutos — cache local (gitignored)
│   └── processed/           # qualidade.csv, trajetoria.csv[.gz], dashboard.json, _meta.json
└── modules/
    ├── qualidade/           # CPC — Indicadores de Qualidade da Educação Superior
    ├── trajetoria/          # Indicadores de Trajetória da Educação Superior
    └── dashboard/           # recorte dos dois datasets acima para o front (ver 3.4)

frontend/
└── src/                     # SPA + dashboards

tests/
```

### 2.1. Estrutura dos módulos

Cada módulo em `app/modules/<fonte>/`:

- `domain/` — `schema.py` (`<Row>(BaseModel)`, fonte da verdade das colunas:
  nome do campo = normalizado, `alias` = nome original) · `column_aliases.py`
  (rótulos alternativos vistos em anos/layouts antigos) · `categories.py`
  (`CATEGORY_LABELS`, decode de colunas codificadas → `<col>_desc`) ·
  `services/transform.py` (`<Fonte>Transformer(SpecTransformer)`)
- `application/` — `ports/` (Protocol `<Fonte>Source`) · `use_cases/`
  (`build_<fonte>_dataset()` monta e roda o `DataPipeline`, grava `_meta.json`)
- `infrastructure/sources/` — `Inep<Fonte>Source`: scrape + download (+ unzip)

O `SpecTransformer`, o `DataPipeline` e o `CsvExporter` são genéricos e ficam no
`core/`. Contratos de arquitetura (`import-linter`): módulos independentes ·
`domain` sem I/O · `application` sem infra pesada.

O módulo `dashboard/` segue a mesma estrutura, com duas adaptações porque a
fonte dele não é o INEP e sim os CSVs que os outros dois módulos já geraram:
`ports/dashboard_source.py` (Protocol `DashboardSource`, com
`read_qualidade()`/`read_trajetoria()` em vez de `collect()` — não estende
`DataSource` porque o formato é outro) · `infrastructure/sources/processed_csv_source.py`
(`ProcessedCsvSource`, implementa o port lendo os CSVs de
`app/data/processed/`) · e, em `domain/`, um arquivo por seção do JSON final
em `domain/services/` (A, B, C, D, E — ver 3.4) em vez de um
`schema.py`/`transform.py` só, já que não há um schema único a normalizar.
`domain/shared.py` (o "schema" do escopo do dashboard, `ScopedData`) e
`domain/section.py` (`DashboardContext` + Protocol `DashboardSection`, com
`key` + `build(context)`) ficam fora de `services/` por serem estrutura, não
comportamento — mesmo critério de `schema.py`/`column_aliases.py` ficarem fora
de `services/` em qualidade/trajetória. Cada seção em `domain/services/`
termina numa classe que implementa `DashboardSection`, e `build_dashboard()`
monta o JSON iterando uma lista dessas — acrescentar uma seção nova é
registrar mais uma linha, não editar o orquestrador.

### 2.2. Arquivos auxiliares

- **`README.md`** — este arquivo (setup + estrutura do projeto).
- **`.env.example`** — template comentado de todas as variáveis (ver 3.4);
  **`.env`** é a cópia local, não versionada.
- **`.gitignore`** — `.venv/`, `__pycache__/`, caches de ferramentas,
  `.env*` (exceto `.env.example`), `.vscode/` (exceto `settings.json`), `docs/`,
  **`app/data/raw/`** (cache de download). `poetry.lock` e
  `app/data/processed/` **são versionados**.
- **`.editorconfig`** —  (LF, `max_line_length = 88`,
  Python `indent_size = 4`, YAML `indent_size = 2`).
- **`.vscode/settings.json`** — define Poetry como env/package manager
  (`python-envs.defaultEnvManager`), É a única exceção ao
  `.vscode/` ignorado.

### 2.3. `.pre-commit-config.yaml`

Hooks `local` / `language: system` (usam o venv do Poetry):

| Hook | Comando | Escopo |
|---|---|---|
| `black` | `poetry run black` | arquivos `.py` alterados |
| `ruff` | `poetry run ruff check app tests --fix` | sempre |
| `mypy` | `poetry run mypy app` | sempre |

Como o hook do Ruff aponta para `app tests`, foi criado `tests/__init__.py` para
a pasta existir. O git hook foi instalado com `poetry run pre-commit install`.

### 2.4. Criação do virtualenv e instalação

```bash
poetry env use python3.12
poetry lock
poetry install
```

- Virtualenv em **`./.venv`** (Python 3.12.3).
- `poetry.lock` gerado e versionado.
- Pacote `app` instalado em modo editável.

### 2.5. Validação

```
$ poetry run pre-commit run --all-files    # black · ruff · mypy
$ poetry run lint-imports                  # Contracts: 3 kept, 0 broken.
$ poetry run pytest                        # 70 passed
```

---

## 3. Pipelines de dados

Fluxo por módulo: **Extract** (scrape + download do INEP) → **Read** (planilha,
seleção de sheet + cabeçalho) → **Transform** (renomeia pelo `schema`, converte
tipos, decodifica categorias, descarta linha com valor que não converte) →
**Load** (CSV em `app/data/processed/`, com `_meta.json`).

### 3.1. Rodando o pipeline completo

Um único comando baixa e processa os dois módulos (Qualidade + Trajetória) e,
em seguida, gera o `dashboard.json` (ver 3.4) a partir dos CSVs resultantes:

```bash
poetry run python -m app.cmd all
```

O que acontece, por módulo:

1. **Scrape** da página do INEP (abas por ano/faixa) — sempre roda.
2. **`HEAD`** em paralelo em cada arquivo identificado (ETag/Last-Modified/
   tamanho) — sempre roda, é rápido (não baixa o corpo).
3. **Download** (em paralelo) só dos arquivos novos ou que mudaram desde a
   última vez; o resto é reaproveitado de `app/data/raw/`.
4. Se **nada mudou em nenhum arquivo** do módulo e já existe um CSV anterior,
   o pipeline **para aqui** — não relê, não retransforma, não reexporta. Log:
   `"<módulo> sem mudanças na fonte | mantém ..."`.
5. Caso contrário: lê (planilha → DataFrame), transforma (renomeia, tipa,
   decodifica, dedup exato) e grava `app/data/processed/<módulo>.csv[.gz]` +
   atualiza `_meta.json`.

Saída esperada num run com tudo novo:

```
app/data/processed/
├── qualidade.csv        (~26 MB,  ~68 mil linhas, 8 anos: 2015-2019, 2021-2023)
├── trajetoria.csv.gz    (~68 MB, ~2,7 milhões de linhas, 11 faixas: 2010-2024)
├── dashboard.json       (~400 KB — recorte da UFC Campus Quixadá + médias nacionais, ver 3.4)
└── _meta.json           (fonte, data de geração, nº de linhas, colunas — por módulo)
```

Tempo aproximado (medido): **qualidade ~20s**, **trajetória ~6 min** do zero
(download paralelo + leitura via `calamine`); rodar de novo sem nada mudar no
INEP: poucos segundos nos dois (só os `HEAD`).

### 3.2. Rodando módulos/anos específicos

```bash
poetry run python -m app.cmd qualidade                 # só qualidade, todo o escopo padrão
poetry run python -m app.cmd trajetoria                # só trajetória
poetry run python -m app.cmd qualidade --years 2023,2022   # subconjunto de anos
poetry run python -m app.cmd trajetoria --force         # ignora o cache e o manifesto, baixa tudo de novo
```

`--force` ignora tanto `app/data/raw/` quanto o `_manifest.json` — sempre baixa
e sempre reprocessa, mesmo que nada tenha mudado no INEP. `dashboard` não aceita
`--years`/`--force` (não baixa nada, só lê CSVs já gerados) — ver 3.4.

### 3.3. Cache dos downloads

Cada módulo mantém `app/data/raw/<módulo>/_manifest.json` (gitignored) com a
URL + `ETag`/`Last-Modified`/tamanho do último download de cada ano/faixa —
usado para decidir, via `HEAD`, se o arquivo precisa ser baixado de novo.
Detalhe em `app/core/infrastructure/http/cached_download.py`.

`download.inep.gov.br` serve cadeia TLS incompleta; o `InepClient` a completa com
a intermediária em `app/core/infrastructure/http/certs/inep_ca_chain.pem`
(pasta `certs/` reservada para esse tipo de arquivo — não é código Python).

### 3.4. Módulo `dashboard`

`qualidade.csv`/`trajetoria.csv.gz` continuam com **todas** as instituições e
cursos do Brasil — isso não muda. O módulo `dashboard` lê esses dois CSVs,
recorta só a instituição/campus configurados (`DASHBOARD_CODIGO_IES` +
`DASHBOARD_CODIGO_MUNICIPIO`, ver 3.5) e grava um único
`app/data/processed/dashboard.json` pronto pro front consumir — sem precisar
reprocessar CSVs de ~68 mil/2,7 milhões de linhas no browser.

```bash
poetry run python -m app.cmd dashboard   # só o dashboard (exige qualidade.csv e trajetoria.csv[.gz] já gerados)
poetry run python -m app.cmd all         # roda os dois pipelines e o dashboard em seguida
```

Tempo aproximado (medido): **~10s**, majoritariamente para calcular as médias
nacionais sobre os ~2,7 milhões de linhas de `trajetoria.csv.gz`.

Cada seção do JSON tem seu próprio arquivo em
`app/modules/dashboard/domain/services/`, para ficar fácil de manter e de
acrescentar mais coisas (`shared.py` fica fora de `services/` por ser
estrutura, não uma seção):

| Arquivo | Chave no JSON | Conteúdo |
|---|---|---|
| `domain/shared.py` | `escopo`, `cursos` | metadados da IES/campus e catálogo de cursos no escopo |
| `domain/services/course_profile.py` | `curso_perfil` | **(A)** perfil por curso: KPIs, evolução do CPC, radar de notas padronizadas, funil por coorte, curva de sobrevivência |
| `domain/services/course_comparison.py` | `comparacao_cursos` | **(B)** comparação entre cursos: ranking de CPC, tabela comparativa, notas por dimensão, evolução do CPC comparada |
| `domain/services/trajectory_comparison.py` | `trajetoria_comparada` | **(C)** trajetória comparada: evasão por curso (alinhada por anos-desde-o-ingresso), heatmap de evasão anual, demanda de ingressantes |
| `domain/services/campus_overview.py` | `campus` | **(D)** visão agregada do campus: KPIs totais, distribuição de cursos por faixa de CPC |
| `domain/services/national_benchmarks.py` | `medias_nacionais` | **(E)** médias nacionais do grupo de pares de cada curso, para comparar com A/C/D — ver abaixo |

`build_dashboard.py` (em `application/use_cases/`) só orquestra: lê os CSVs,
monta o `ScopedData` (`shared.build_scoped_data`) e chama cada arquivo acima
uma vez, reaproveitando os KPIs por curso entre as seções B e D em vez de
recalculá-los.

**Médias nacionais (E)**: como `qualidade.csv`/`trajetoria.csv.gz` continuam
com o Brasil inteiro, `national_benchmarks.py` recebe os dois CSVs completos
(antes do recorte) e calcula a média de cada métrica só entre os
**cursos-pares** — mesma área de avaliação (CPC/notas) ou mesma classificação
CINE (trajetória) que os cursos do campus oferecem — nunca a média de todas
as áreas do Brasil misturadas (isso compararia Direito com Engenharia). Por
isso `medias_nacionais` é um bloco à parte, não um campo dentro de cada linha
de A/C/D: o front cruza pela chave de área (`area_avaliacao` ou
`nome_cine_area_geral`, presentes nas linhas de A/C que fazem sentido
comparar) e decide como exibir.

| Chave em `medias_nacionais` | Contraparte nacional de | Chave de junção |
|---|---|---|
| `evolucao_cpc` | A2 | `area_avaliacao` + `ano` |
| `perfil_radar` | A3 | `area_avaliacao` (ano mais recente por área) |
| `curva_sobrevivencia` | A5 / C1 | `nome_cine_area_geral` + `anos_desde_ingresso` (não ano calendário — alinha coortes de anos diferentes) |
| `heatmap_evasao_anual` | C2 | `nome_cine_area_geral` + `ano_referencia` (ano calendário direto) |
| `campus` | D | — (já agregado, calculado só com os cursos-pares das áreas do campus) |

Cada linha nacional também traz `quantidade_cursos_considerados`, pra
transparência de quantos cursos entraram na média. **A1** (KPIs por curso),
**A4** (funil por coorte) e **C3** (demanda de ingressantes) não têm
contraparte nacional: são números absolutos (não comparáveis entre
instituições de tamanhos diferentes) ou não têm um ponto de coorte alinhado
nacionalmente — o front usa `curva_sobrevivencia` no mesmo
`anos_desde_ingresso` do curso local para comparar de forma justa.

### 3.5. Configuração via `.env`

Os parâmetros abaixo vêm de `app/core/config/settings.py` (`pydantic-settings`)
e podem ser trocados **sem mexer em código** — copie `.env.example` para `.env`
e edite:

| Variável | Default | Para que serve |
|---|---|---|
| `QUALIDADE_LANDING_URL` | URL do portal de Indicadores de Qualidade | se o INEP mudar a página |
| `TRAJETORIA_LANDING_URL` | URL do portal de Indicadores de Trajetória | se o INEP mudar a página |
| `QUALIDADE_MIN_YEAR` / `QUALIDADE_MAX_YEAR` | `2015` / `2025` | janela de anos do CPC processada por padrão (sem `--years`) |
| `TRAJETORIA_MIN_YEAR` / `TRAJETORIA_MAX_YEAR` | vazio (sem restrição) | idem, para a Trajetória — vazio processa todas as faixas da página |
| `HTTP_MAX_RETRIES` / `HTTP_BACKOFF` | `3` / `2.0` | tentativas e espera (segundos, exponencial) em cada request ao INEP |
| `HTTP_TIMEOUT` | `30.0` | timeout (segundos) de cada request |
| `HTTP_USER_AGENT` | `PROGRAD-Analytics/0.1 (data pipeline)` | header enviado ao INEP |
| `CSV_GZIP_THRESHOLD_MB` | `40` | acima disso o CSV final vira `.csv.gz` |
| `LOG_LEVEL` | `INFO` | nível de log (`DEBUG`, `INFO`, `WARNING`, ...) |
| `DASHBOARD_CODIGO_IES` | `583` (UFC) | código INEP da IES que o `dashboard.json` recorta |
| `DASHBOARD_CODIGO_MUNICIPIO` | `2311306` (Quixadá) | código IBGE do município/campus recortado |
| `DASHBOARD_NOME_CAMPUS` | `UFC Campus Quixadá` | rótulo exibido no front (chave `escopo.municipio`) |

`QUALIDADE_MIN_YEAR=2015` não é um ajuste arbitrário: antes disso o CPC tem
outro grão (IES × Área, sem `Código do Curso`) — mudar exige revisar
`app/modules/qualidade/domain/schema.py` e os aliases, não só o `.env`.

Parâmetros de **parsing** (padrões de nome de sheet/arquivo, linha do
cabeçalho) ficam no código, não no `.env` — são acoplados à estrutura exata
dos arquivos do INEP; um valor errado quebra a leitura em silêncio.

## 4. Como inicializar o ambiente

Pré-requisitos: **Python 3.12+** e **Poetry 2.x** instalados.

```bash
# 1. Entrar no repositório
cd PROGRAD-Analytics

# 2. Criar o virtualenv e instalar tudo (runtime + grupo dev)
poetry install

# 3. Instalar o git hook de pre-commit (uma vez por clone)
poetry run pre-commit install
```

`poetry install` lê `poetry.toml` + `pyproject.toml` + `poetry.lock`, cria
`./.venv` com Python 3.12 e instala o pacote `app`.

### Usar o ambiente

```bash
poetry run python -m app ...       # rodar algo dentro do ambiente
poetry env activate                # imprime o comando de ativação
source .venv/bin/activate          # ativação direta   /   deactivate para sair
```

### Ferramentas de qualidade

```bash
poetry run black .                 # formatar
poetry run ruff check app tests --fix   # lint + autofix
poetry run mypy app                # checagem de tipos
poetry run lint-imports            # contratos de import (import-linter)
poetry run pre-commit run --all-files   # roda os 3 hooks em tudo
```

### Gerenciar dependências

```bash
poetry add <pacote>                     # dependência de runtime
poetry add --group dev <pacote>         # dependência de desenvolvimento
poetry remove <pacote>
poetry show --tree
poetry update                           # atualiza dentro das restrições + regrava o lock
```

Sempre faça commit de `pyproject.toml` **e** `poetry.lock` juntos.
