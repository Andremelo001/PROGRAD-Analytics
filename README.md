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

| Pacote | Restrição | Uso |
|---|---|---|
| `pydantic-settings` | `>=2.7.0,<3.0.0` | `app/core/config/settings.py` — carrega config de env / `.env` |
| `loguru` | `>=0.7.3,<0.8.0` | `app/core/config/log.py` — logging |

### Dependências de desenvolvimento

Instaladas via Poetry:

| Pacote | Restrição | Resolvido |
|---|---|---|
| `ruff` | `^0.5.0` | 0.5.7 |
| `mypy` | `^1.10.1` | 1.20.2 |
| `black` | `^24.4.2` | 24.10.0 |
| `pre-commit` | `^3.7.1` | 3.8.0 |
| `import-linter` | `^2.11` | 2.14 |

`[tool.mypy]` usa `plugins = ["pydantic.mypy"]`.

---

### 2. Estrutura de pastas

```
app/
├── __init__.py
├── cmd/                     # entrypoints — scripts que orquestram os pipelines
├── core/                    # código transversal, compartilhado por todos os módulos
│   ├── config/              # settings.py (env/.env via pydantic-settings) + log.py (loguru)
│   ├── domain/              # domínio genérico, sem dependência de framework
│   │   ├── entities/        # entidades base reutilizáveis
│   │   ├── enums/           # enumerações compartilhadas
│   │   ├── interfaces/      # Protocols: DataSource, Exporter, Pipeline
│   │   ├── pipelines/       # base extract → transform → load
│   │   └── value_objects/   # objetos de valor imutáveis
│   └── infrastructure/      # implementações técnicas transversais
│       ├── http/            # cliente HTTP compartilhado (coleta)
│       ├── observability/   # logging
│       └── storage/         # helpers de escrita de arquivo
├── data/                    # saídas dos scripts
│   ├── raw/                 # dados baixados brutos
│   └── processed/           # JSON/CSV limpos, consumidos pelo frontend
└── modules/                 # um subpacote por fonte de dados:
                             #   domain/{entities,services}
                             #   application/{ports,use_cases}
                             #   infrastructure/{sources,exporters}

frontend/
└── src/                     # SPA + dashboards

tests/                       # suíte de testes; espelha a estrutura de app/
```

### 2.1. Estrutura dos módulos

Cada módulo em `app/modules/<fonte>/` segue a arquitetura em camadas:

- `domain/` — `entities/` (modelo do dado da fonte), `services/` (regras de
  limpeza / normalização / cálculo)
- `application/` — `ports/` (Protocols da fonte), `use_cases/` (orquestra
  coletar → transformar → exportar)
- `infrastructure/` — `sources/` (scraper/cliente da fonte, implementa a porta de
  coleta), `exporters/` (grava JSON/CSV em `app/data/processed/`, implementa a
  porta de saída)

Os entrypoints ficam em `app/cmd/`.

### 2.2. Arquivos auxiliares

- **`README.md`** — este arquivo (setup + estrutura do projeto).
- **`.gitignore`** — `.venv/`, `__pycache__/`, caches de ferramentas
  (`.pytest_cache/`, `.ruff_cache/`, `.mypy_cache/`, `.dmypy.json`,
  `.import_linter_cache/`), `.env*` (exceto `.env.example`),
  `.ipynb_checkpoints/`, `.idea/`, `.vscode/` (exceto `settings.json`).
  O **`poetry.lock` é versionado**.
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
$ poetry check
All set!

$ poetry run ruff check app
All checks passed!

$ poetry run mypy app
Success: no issues found in 26 source files

$ poetry run lint-imports
Contracts: 0 kept, 0 broken.

$ poetry run pre-commit run --all-files
Format with Black....Passed
Check with Ruff......Passed
Validate types with MyPy....Passed
```

---

## 3. Como inicializar o ambiente

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
