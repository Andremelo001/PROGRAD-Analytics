from collections.abc import Mapping, Sequence

from pydantic import BaseModel

from app.core.domain.value_objects.column_spec import ColumnSpec, DType

_PY_TO_DTYPE: dict[type, DType] = {int: "int", float: "float", str: "string"}


class SchemaMappingError(ValueError):
    """Nomes de colunas/categorias externos incoerentes com o schema do módulo."""


def model_to_specs(
    model: type[BaseModel],
    column_names: Mapping[str, Sequence[str]],
    *,
    context: str = "",
) -> list[ColumnSpec]:
    """Junta o schema do módulo (código) com os nomes das colunas (configuração).

    Do modelo pydantic vem o contrato interno: nome do campo = normalizado,
    anotação = tipo alvo, ``description``. De ``column_names`` (lido de
    ``colunas_inep.json``) vêm os nomes que cada coluna já teve nos arquivos do
    INEP — o primeiro é o atual. Toda coluna do modelo precisa ter nomes, e
    nenhum nome interno desconhecido pode sobrar (erro de digitação no JSON).
    ``context`` identifica a origem nas mensagens de erro.
    """
    fields = model.model_fields
    missing = [name for name in fields if name not in column_names]
    unknown = [name for name in column_names if name not in fields]
    if missing or unknown:
        problems = []
        if missing:
            problems.append(f"colunas sem nome definido: {', '.join(missing)}")
        if unknown:
            problems.append(
                f"nomes internos desconhecidos (não altere o nome à esquerda): "
                f"{', '.join(unknown)}"
            )
        prefix = f"{context}: " if context else ""
        raise SchemaMappingError(prefix + "; ".join(problems))

    specs: list[ColumnSpec] = []
    for name, info in fields.items():
        annotation = info.annotation
        dtype = _PY_TO_DTYPE.get(annotation) if annotation is not None else None
        if dtype is None:
            msg = f"campo {name!r}: tipo {annotation!r} não é int/float/str"
            raise TypeError(msg)
        specs.append(
            ColumnSpec(
                normalized=name,
                dtype=dtype,
                aliases=tuple(column_names[name]),
                description=info.description,
            )
        )
    return specs


def validate_category_columns(
    specs: Sequence[ColumnSpec],
    category_labels: Mapping[str, Mapping[int, str]],
    *,
    context: str = "",
) -> None:
    """Toda coluna em ``categorias`` precisa existir no schema e ser inteira."""
    dtypes = {spec.normalized: spec.dtype for spec in specs}
    problems = []
    for column in category_labels:
        if column not in dtypes:
            problems.append(f"categoria para coluna desconhecida: {column}")
        elif dtypes[column] != "int":
            problems.append(f"categoria em coluna não numérica: {column}")
    if problems:
        prefix = f"{context}: " if context else ""
        raise SchemaMappingError(prefix + "; ".join(problems))
