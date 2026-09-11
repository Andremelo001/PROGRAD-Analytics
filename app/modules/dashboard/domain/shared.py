import json
from dataclasses import dataclass

import pandas as pd

from app.core.config.settings import settings

_CATALOG_COLUMNS = ["codigo_curso", "nome_curso", "grau_academico", "modalidade_ensino"]


@dataclass(frozen=True, slots=True)
class ScopedData:
    """Os dois datasets nacionais já recortados para o escopo do dashboard."""

    qualidade: pd.DataFrame
    trajetoria: pd.DataFrame
    cursos: pd.DataFrame


def build_scoped_data(
    qualidade_raw: pd.DataFrame, trajetoria_raw: pd.DataFrame
) -> ScopedData:
    """Filtra os dois datasets pelo escopo configurado e monta o catálogo.

    O escopo vem de ``settings.dashboard_*`` (codigo_ies/codigo_municipio).
    """
    qualidade = _filter_scope(qualidade_raw)
    trajetoria = _filter_scope(trajetoria_raw)
    cursos = _course_catalog(trajetoria, qualidade)
    qualidade = with_course_name(qualidade, cursos)
    return ScopedData(qualidade=qualidade, trajetoria=trajetoria, cursos=cursos)


def _filter_scope(frame: pd.DataFrame) -> pd.DataFrame:
    if frame.empty:
        return frame
    mask = (frame["codigo_ies"] == settings.dashboard_codigo_ies) & (
        frame["codigo_municipio"] == settings.dashboard_codigo_municipio
    )
    return frame.loc[mask].reset_index(drop=True)


def _course_catalog(trajetoria: pd.DataFrame, qualidade: pd.DataFrame) -> pd.DataFrame:
    from_trajetoria = pd.DataFrame(columns=_CATALOG_COLUMNS)
    if not trajetoria.empty:
        from_trajetoria = (
            trajetoria[
                [
                    "codigo_curso",
                    "nome_curso",
                    "tp_grau_academico_desc",
                    "tp_modalidade_ensino_desc",
                ]
            ]
            .drop_duplicates("codigo_curso")
            .rename(
                columns={
                    "tp_grau_academico_desc": "grau_academico",
                    "tp_modalidade_ensino_desc": "modalidade_ensino",
                }
            )
        )

    known = set(from_trajetoria["codigo_curso"]) if not from_trajetoria.empty else set()
    extra = pd.DataFrame(columns=_CATALOG_COLUMNS)
    if not qualidade.empty:
        only_qualidade = qualidade.loc[
            ~qualidade["codigo_curso"].isin(known), ["codigo_curso", "area_avaliacao"]
        ]
        only_qualidade = only_qualidade.drop_duplicates("codigo_curso").rename(
            columns={"area_avaliacao": "nome_curso"}
        )
        only_qualidade["grau_academico"] = None
        only_qualidade["modalidade_ensino"] = None
        extra = only_qualidade[_CATALOG_COLUMNS]

    catalog = pd.concat([from_trajetoria, extra], ignore_index=True)
    return catalog.sort_values("codigo_curso").reset_index(drop=True)


def with_course_name(frame: pd.DataFrame, cursos: pd.DataFrame) -> pd.DataFrame:
    """Anexa ``nome_curso`` a um frame que só tem ``codigo_curso`` (ex.: qualidade)."""
    if frame.empty or "nome_curso" in frame.columns:
        return frame
    lookup = cursos.set_index("codigo_curso")["nome_curso"]
    out = frame.copy()
    out["nome_curso"] = out["codigo_curso"].map(lookup)
    return out


def build_escopo(
    qualidade: pd.DataFrame, trajetoria: pd.DataFrame
) -> dict[str, object]:
    nome_ies = None
    sigla_ies = None
    if not qualidade.empty:
        nome_ies = qualidade["nome_ies"].iloc[0]
        sigla_ies = qualidade["sigla_ies"].iloc[0]
    elif not trajetoria.empty:
        nome_ies = trajetoria["nome_ies"].iloc[0]
    return {
        "codigo_ies": settings.dashboard_codigo_ies,
        "nome_ies": nome_ies,
        "sigla_ies": sigla_ies,
        "codigo_municipio": settings.dashboard_codigo_municipio,
        "municipio": settings.dashboard_nome_campus,
    }


def records(frame: pd.DataFrame) -> list[dict[str, object]]:
    """Converte um DataFrame em lista de dicts JSON-seguros.

    ``NaN``/``NaT`` viram ``null`` e tipos numpy viram tipos nativos.
    """
    if frame is None or frame.empty:
        return []
    return json.loads(frame.to_json(orient="records"))


def scalar(row: pd.Series | None, column: str) -> object:
    """Extrai um valor escalar de uma linha, já convertido pra tipo nativo.

    Retorna ``None`` se a linha for ``None`` ou o valor for nulo.
    """
    if row is None or column not in row or pd.isna(row[column]):
        return None
    value = row[column]
    return value.item() if hasattr(value, "item") else value
