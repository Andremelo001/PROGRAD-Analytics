# Guia: nomes das colunas do INEP (`colunas_inep.json`)

Este guia é pra quem precisa manter o sistema funcionando quando o **INEP muda
o nome de uma coluna** nas planilhas que ele publica — sem precisar mexer em
código. Todo o ajuste é feito em um único arquivo: **`colunas_inep.json`**, na
raiz do repositório (ao lado deste guia).

---

## 1. Pra que serve esse arquivo

O sistema baixa as planilhas do INEP (Indicadores de Qualidade/CPC e
Indicadores de Trajetória) e precisa saber **qual coluna da planilha é qual
informação**. Por exemplo: a coluna que o INEP chama de `CPC (Contínuo)` é a
informação que o sistema chama internamente de `cpc_continuo`.

Esse "dicionário" entre o nome do INEP e o nome interno fica no
`colunas_inep.json`. Se o INEP renomear uma coluna num ano novo, basta
acrescentar o nome novo nesse arquivo.

O arquivo também guarda o **texto das categorias** que o INEP publica como
código (ex.: `1` = "Pública Federal", `2` = "Bacharelado").

---

## 2. Como saber que é preciso mexer

Rode o pipeline normalmente (ver seção 5). Se o INEP publicou um arquivo com
nome de coluna diferente, aparece um aviso assim no final:

```
REVISAR | module=qualidade file=CPC_2027.xlsx faltando=['cpc_continuo'] novas_sem_par=['CPC Contínuo 2027']
```

Leia assim:

- **`module=qualidade`** — em qual seção do arquivo mexer (`qualidade` ou `trajetoria`).
- **`faltando=['cpc_continuo']`** — informação que o sistema esperava e **não
  encontrou** na planilha nova (é o nome interno, à esquerda no JSON).
- **`novas_sem_par=['CPC Contínuo 2027']`** — coluna que apareceu na planilha
  e o sistema **não reconheceu** (é o nome novo que o INEP passou a usar).

Quando os dois aparecem juntos e claramente são a mesma coisa (como acima), é
só uma coluna renomeada. Os mesmos dados também ficam registrados em
`backend/app/data/processed/_meta.json`, no campo `review_items`.

> **Atenção:** nem todo aviso é problema. Veja a seção 6, com os avisos que
> são normais e podem ser ignorados.

---

## 3. Como o arquivo é organizado

```json
{
  "qualidade": {
    "colunas": {
      "ano":          ["Ano", "Edição"],
      "cpc_continuo": ["CPC (Contínuo)", "CPC Contínuo"],
      ...
    },
    "categorias": {}
  },
  "trajetoria": {
    "colunas": { ... },
    "categorias": {
      "tp_grau_academico": {
        "1": "Bacharelado",
        "2": "Licenciatura",
        "3": "Tecnológico"
      },
      ...
    }
  }
}
```

Em **`colunas`**, cada linha tem duas partes:

| Parte | Exemplo | Pode alterar? |
|---|---|---|
| À **esquerda** (antes dos `:`) — nome interno | `"cpc_continuo"` | **Não.** O resto do sistema (CSVs, painel) depende dele. |
| À **direita** (entre `[ ]`) — nomes que a coluna já teve no INEP | `["CPC (Contínuo)", "CPC Contínuo"]` | **Sim.** É aqui que se trabalha. |

A lista da direita guarda **todos os nomes** que aquela coluna já teve. O
**primeiro** é o nome atual; os outros continuam valendo pras planilhas de anos
anteriores — **não apague nomes antigos**, senão os anos antigos param de ser
lidos.

Em **`categorias`**, cada coluna codificada tem o texto de cada código. O
código fica entre aspas (`"1"`), o texto também.

O bloco `_leia_me` no topo do arquivo são só instruções — o sistema ignora.

---

## 4. Passo a passo

### 4.1. O INEP renomeou uma coluna

1. Veja no aviso `REVISAR` o nome interno (`faltando`) e o nome novo (`novas_sem_par`).
2. Abra `colunas_inep.json` e ache a linha do nome interno, na seção certa
   (`qualidade` ou `trajetoria`).
3. Acrescente o nome novo **no início** da lista, copiando exatamente como veio
   no aviso, entre aspas e seguido de vírgula:

   ```json
   antes:  "cpc_continuo": ["CPC (Contínuo)", "CPC Contínuo"],
   depois: "cpc_continuo": ["CPC Contínuo 2027", "CPC (Contínuo)", "CPC Contínuo"],
   ```

4. Salve e rode o pipeline de novo (seção 5).

Não precisa se preocupar com diferenças de **acento, maiúscula/minúscula,
espaços a mais ou `*` no final** — o sistema já ignora isso na comparação
(`"Código da IES*"` e `"codigo da ies"` são considerados iguais). Só
acrescente um nome novo se o texto mudou de verdade.

### 4.2. O INEP criou um código novo numa categoria

Ex.: um código `6` novo em "Categoria Administrativa". Acrescente a linha no
bloco da coluna, em `categorias`:

```json
"tp_categoria_administrativa": {
  "1": "Pública Federal",
  ...
  "6": "Texto do novo código",
  "7": "Especial"
},
```

Sem isso, os dados continuam sendo processados — só a coluna de texto
(`tp_categoria_administrativa_desc`) fica vazia pras linhas com o código novo.

---

## 5. Rodar o pipeline depois de editar

Da raiz do repositório (precisa de internet — o sistema confere no site do
INEP se há arquivos novos):

```bash
cd backend
poetry run python -m app.cmd qualidade    # ou: trajetoria, ou: all (os dois + o painel)
```

**Não é preciso nenhuma opção extra.** O sistema percebe sozinho que o
`colunas_inep.json` mudou desde a última execução e reprocessa usando as
planilhas que já estão baixadas — no log aparece:

```
module qualidade | colunas_inep.json mudou desde a última geração — reprocessando a partir dos arquivos em cache
```

Depois de reprocessar, confira o final do log: o aviso `REVISAR` do arquivo
que você corrigiu **não deve aparecer mais**. Se ainda aparecer, compare letra
por letra o nome que você digitou com o que está em `novas_sem_par`.

Pra atualizar o painel (os JSONs de `dashboard/`) com os dados corrigidos, rode também
`poetry run python -m app.cmd dashboard` — ou use `all`, que faz tudo.

---

## 6. Avisos conhecidos que podem ser ignorados

Logo depois de uma edição no arquivo, o sistema reavalia **todas** as
planilhas (pra você ver se a correção funcionou). Por isso aparecem também
alguns avisos que **sempre existiram e são esperados** — não indicam erro:

| Seção | Planilhas | Aviso | Por quê é normal |
|---|---|---|---|
| qualidade | CPC 2015, 2016, 2017 | `faltando=['nota_padronizada_fg', 'nota_padronizada_ce']` | Essas notas só passaram a ser publicadas a partir de 2018. |
| qualidade | CPC 2015, 2016, 2017 | `novas_sem_par=['Nº de Docentes' / 'Nr. de Docentes', 'Observação' / 'Obs']` | Colunas que o INEP publica mas o sistema não usa. |
| qualidade | CPC 2019 | `novas_sem_par=['Observação']` | Idem. |
| qualidade | CPC 2021 | `novas_sem_par=['Grau acadêmico', 'Entidade Beneficiente de Assistência Social (CEBAS)']` | Idem. |
| qualidade | CPC 2022, 2023 | `novas_sem_par=['Entidade Beneficiente de Assistência Social (CEBAS)']` | Idem. |

Regra geral: um aviso **só com `novas_sem_par`** (sem nada em `faltando`)
normalmente é o INEP publicando uma coluna **extra** que o sistema não usa — só
é problema se for um nome novo de uma coluna que está em `faltando` em outro
aviso do mesmo arquivo.

---

## 7. Se algo der errado

O sistema confere o arquivo antes de processar qualquer coisa. Se houver
erro, ele **para sem gerar nada** e mostra o motivo:

| Mensagem | O que aconteceu | Como resolver |
|---|---|---|
| `JSON inválido na linha 13, coluna 31 ...` | Erro de digitação no formato (vírgula sobrando ou faltando, aspas ou colchete sem fechar) | Vá até a linha indicada. O erro mais comum é vírgula depois do último item de uma lista: `["A", "B",]` → `["A", "B"]` |
| `nomes internos desconhecidos (não altere o nome à esquerda): ...` | O nome à esquerda de alguma linha foi alterado ou digitado errado | Volte o nome à esquerda para o original (ele aparece em `colunas sem nome definido` na mesma mensagem) |
| `colunas sem nome definido: ...` | Uma linha foi apagada | Restaure a linha (use o histórico do git ou a versão anterior do arquivo) |
| `colunas.xxx: List should have at least 1 item` | A lista da direita ficou vazia `[]` | Toda coluna precisa de pelo menos um nome |
| `categoria para coluna desconhecida: ...` | Um bloco de `categorias` com nome de coluna que não existe | Confira o nome do bloco |

Dica: editores como o VS Code sublinham em vermelho erros de formato no JSON
enquanto você digita.

---

## 8. O que **não** se resolve por aqui

Estes casos precisam de alguém que programe, porque afetam o formato dos CSVs
e do painel:

- O INEP passou a publicar uma **informação nova** que deve entrar no sistema
  (uma coluna que ainda não existe à esquerda no arquivo).
- O INEP **deixou de publicar** uma informação que o sistema usa (aparece em
  `faltando` e não existe nenhuma coluna nova equivalente).
- Uma coluna mudou de **tipo** (ex.: era número e passou a vir como texto).

Nesses casos, a mudança é feita em
`backend/app/modules/<qualidade|trajetoria>/domain/schema.py` junto com o
`colunas_inep.json`.

---

## 9. Detalhes técnicos (pra quem programa)

- Leitura e validação: `backend/app/core/config/column_mapping.py`
  (`load_column_mapping`), cruzado com o `schema.py` de cada módulo em
  `model_to_specs`/`validate_category_columns` (`backend/app/core/domain/pipelines/schema.py`).
- Comparação de nomes: `normalize_key` (`backend/app/core/domain/normalization.py`).
- Reprocessamento automático: a cada geração, o hash da seção do módulo
  (`ModuleColumnMapping.fingerprint()`) é gravado como `mapping_fingerprint` no
  `_meta.json`; se o hash atual for diferente, o `DataPipeline` reprocessa a
  partir do cache mesmo sem arquivo novo na fonte, e reavalia os avisos de
  todos os arquivos (`FileReport.needs_review(config_changed=True)`).
- O caminho do arquivo pode ser trocado pela variável `COLUNAS_INEP_FILE` no `.env`.
