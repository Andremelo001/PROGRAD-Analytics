from collections.abc import Mapping, Sequence

from pydantic import BaseModel

from app.core.domain.value_objects.column_spec import ColumnSpec, DType

_PY_TO_DTYPE: dict[type, DType] = {int: "int", float: "float", str: "string"}


def model_to_specs(
    model: type[BaseModel],
    extra_aliases: Mapping[str, Sequence[str]] | None = None,
) -> list[ColumnSpec]:
    """Deriva a lista de ``ColumnSpec`` a partir de um modelo pydantic.

    Cada campo vira uma coluna: nome do campo = normalizado, ``alias`` = nome
    original canônico (do arquivo mais novo / .md), anotação = tipo alvo,
    ``description`` = descrição. ``extra_aliases`` (normalizado -> rótulos
    alternativos) cobre variações de nome entre anos/layouts diferentes.
    """
    extra = dict(extra_aliases or {})
    specs: list[ColumnSpec] = []
    for name, info in model.model_fields.items():
        annotation = info.annotation
        dtype = _PY_TO_DTYPE.get(annotation) if annotation is not None else None
        if dtype is None:
            msg = f"campo {name!r}: tipo {annotation!r} não é int/float/str"
            raise TypeError(msg)
        primary = info.alias if info.alias is not None else name
        aliases = (primary, *extra.get(name, ()))
        specs.append(
            ColumnSpec(
                normalized=name,
                dtype=dtype,
                aliases=aliases,
                description=info.description,
            )
        )
    return specs
