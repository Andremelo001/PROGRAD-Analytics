import hashlib
import json
from pathlib import Path
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, ValidationError

from app.core.config.settings import settings

_NonEmptyText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class ColumnMappingError(ValueError):
    """``colunas_inep.json`` ausente, inválido ou incoerente com o schema."""


class ModuleColumnMapping(BaseModel):
    """Uma seção de ``colunas_inep.json`` (``qualidade`` ou ``trajetoria``).

    ``colunas``: nome interno -> nomes que a coluna já teve nos arquivos do
    INEP (o primeiro é o atual). ``categorias``: coluna codificada -> código ->
    rótulo. As chaves de código chegam como texto no JSON (``"1"``) e viram
    ``int`` aqui.
    """

    model_config = ConfigDict(extra="forbid")

    colunas: dict[str, Annotated[list[_NonEmptyText], Field(min_length=1)]]
    categorias: dict[str, dict[int, _NonEmptyText]] = Field(default_factory=dict)

    def fingerprint(self) -> str:
        """Hash do conteúdo da seção — muda se qualquer nome/rótulo mudar.

        Guardado no ``_meta.json`` a cada geração: se o JSON foi editado desde
        então, o pipeline reprocessa a partir do cache em vez de reaproveitar
        o CSV antigo (que ainda refletiria os nomes antigos). Ordem das chaves
        e formatação do arquivo não afetam o hash.
        """
        canonical = json.dumps(
            self.model_dump(mode="json"), sort_keys=True, ensure_ascii=False
        )
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]


def load_column_mapping(
    module: str, *, path: Path | None = None
) -> ModuleColumnMapping:
    """Lê a seção ``module`` de ``colunas_inep.json``.

    Só valida o formato do arquivo; a coerência com o schema do módulo (toda
    coluna esperada presente, nenhuma desconhecida) é checada em
    ``model_to_specs``/``validate_category_columns``.
    """
    file = path if path is not None else settings.colunas_inep_file
    try:
        raw = json.loads(file.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        msg = f"arquivo de colunas do INEP não encontrado: {file}"
        raise ColumnMappingError(msg) from exc
    except json.JSONDecodeError as exc:
        msg = (
            f"{file.name}: JSON inválido na linha {exc.lineno}, coluna {exc.colno} "
            f"({exc.msg}) — confira vírgulas, aspas e colchetes perto desse ponto"
        )
        raise ColumnMappingError(msg) from exc

    if not isinstance(raw, dict) or module not in raw:
        msg = f"{file.name}: seção {module!r} não encontrada"
        raise ColumnMappingError(msg)

    try:
        return ModuleColumnMapping.model_validate(raw[module])
    except ValidationError as exc:
        problems = "; ".join(
            f"{'.'.join(str(p) for p in err['loc'])}: {err['msg']}"
            for err in exc.errors()
        )
        msg = f"{file.name} [{module}]: {problems}"
        raise ColumnMappingError(msg) from exc
