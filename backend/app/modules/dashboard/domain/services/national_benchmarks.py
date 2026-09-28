import pandas as pd

from app.modules.dashboard.domain.section import DashboardContext
from app.modules.dashboard.domain.services import course_profile
from app.modules.dashboard.domain.shared import ScopedData, records

_RATE_COLUMNS = (
    "taxa_permanencia",
    "taxa_conclusao_acumulada",
    "taxa_desistencia_acumulada",
)


def build(
    qualidade_nacional: pd.DataFrame,
    trajetoria_nacional: pd.DataFrame,
    data: ScopedData,
) -> dict[str, object]:
    """Médias nacionais por grupo de pares."""
    pares_qualidade = _pares_nacionais(
        qualidade_nacional, data.qualidade, "area_avaliacao"
    )
    pares_trajetoria = _pares_nacionais(
        trajetoria_nacional, data.trajetoria, "nome_cine_area_geral"
    )
    return {
        "evolucao_cpc": _evolucao_cpc_nacional(pares_qualidade),
        "perfil_radar": _perfil_radar_nacional(pares_qualidade),
        "curva_sobrevivencia": _curva_sobrevivencia_nacional(pares_trajetoria),
        "heatmap_evasao_anual": _heatmap_evasao_nacional(pares_trajetoria),
        "campus": _campus_nacional(pares_qualidade, pares_trajetoria),
    }


def _pares_nacionais(
    nacional: pd.DataFrame, escopo_local: pd.DataFrame, coluna_area: str
) -> pd.DataFrame:
    """Restringe o dataset nacional às áreas que o campus realmente oferece."""
    if nacional.empty or escopo_local.empty or coluna_area not in escopo_local.columns:
        return nacional.iloc[0:0]
    areas = set(escopo_local[coluna_area].dropna().unique())
    return nacional[nacional[coluna_area].isin(areas)]


def _evolucao_cpc_nacional(pares_qualidade: pd.DataFrame) -> list[dict[str, object]]:
    """Contraparte nacional: CPC médio por área de avaliação, por ano."""
    if pares_qualidade.empty:
        return []
    valid = pares_qualidade.dropna(subset=["cpc_continuo"])
    if valid.empty:
        return []
    grouped = valid.groupby(["area_avaliacao", "ano"])["cpc_continuo"].agg(
        ["mean", "count"]
    )
    grouped = grouped.rename(
        columns={
            "mean": "cpc_continuo_medio_nacional",
            "count": "quantidade_cursos_considerados",
        }
    )
    return records(
        grouped.round(2).reset_index().sort_values(["area_avaliacao", "ano"])
    )


def _perfil_radar_nacional(pares_qualidade: pd.DataFrame) -> list[dict[str, object]]:
    """Contraparte nacional: notas padronizadas médias por área.

    Usa o ano mais recente disponível para cada área.
    """
    if pares_qualidade.empty:
        return []
    max_ano_por_area = pares_qualidade.groupby("area_avaliacao")["ano"].transform("max")
    latest = pares_qualidade[pares_qualidade["ano"] == max_ano_por_area]
    radar_cols = list(course_profile.RADAR_FIELDS.values())
    means = latest.groupby("area_avaliacao")[radar_cols].mean()
    means = means.rename(
        columns={column: label for label, column in course_profile.RADAR_FIELDS.items()}
    )
    means["quantidade_cursos_considerados"] = latest.groupby("area_avaliacao")[
        "codigo_curso"
    ].nunique()
    return records(means.round(2).reset_index().sort_values("area_avaliacao"))


def _curva_sobrevivencia_nacional(
    pares_trajetoria: pd.DataFrame,
) -> list[dict[str, object]]:
    """Contraparte nacional: taxas médias por área CINE.

    Alinhadas por anos-desde-o-ingresso — assim coortes de anos diferentes,
    de instituições diferentes, ficam comparáveis.
    """
    if pares_trajetoria.empty:
        return []
    working = pares_trajetoria.copy()
    working["anos_desde_ingresso"] = working["ano_referencia"] - working["ano_ingresso"]
    group_cols = ["nome_cine_area_geral", "anos_desde_ingresso"]
    grouped = working.groupby(group_cols)[list(_RATE_COLUMNS)].mean()
    grouped = grouped.rename(
        columns={col: f"{col}_media_nacional" for col in _RATE_COLUMNS}
    )
    grouped["quantidade_cursos_considerados"] = working.groupby(group_cols)[
        "codigo_curso"
    ].nunique()
    return records(grouped.round(2).reset_index().sort_values(group_cols))


def _heatmap_evasao_nacional(pares_trajetoria: pd.DataFrame) -> list[dict[str, object]]:
    """Contraparte nacional: desistência anual média por área CINE.

    Por ano de referência — aqui é direto por ano calendário, sem precisar
    alinhar por coorte (o heatmap local já é assim).
    """
    if pares_trajetoria.empty:
        return []
    group_cols = ["nome_cine_area_geral", "ano_referencia"]
    media = pares_trajetoria.groupby(group_cols)["taxa_desistencia_anual"].mean()
    media = media.rename("taxa_desistencia_anual_media_nacional")
    quantidade = pares_trajetoria.groupby(group_cols)["codigo_curso"].nunique()
    quantidade = quantidade.rename("quantidade_cursos_considerados")
    grouped = pd.concat([media, quantidade], axis=1)
    return records(grouped.round(2).reset_index().sort_values(group_cols))


def _campus_nacional(
    pares_qualidade: pd.DataFrame, pares_trajetoria: pd.DataFrame
) -> dict[str, object]:
    """Contraparte nacional: mesmas métricas de ``campus_overview``.

    Calculadas sobre os cursos-pares do Brasil inteiro em vez dos cursos do
    campus.
    """
    return {
        "kpis": _kpis_nacional(pares_trajetoria),
        "distribuicao_cpc_faixa": _distribuicao_cpc_faixa_nacional(pares_qualidade),
    }


def _kpis_nacional(pares_trajetoria: pd.DataFrame) -> dict[str, object]:
    if pares_trajetoria.empty:
        return {
            "taxa_conclusao_media_nacional": None,
            "taxa_desistencia_media_nacional": None,
            "quantidade_cursos_considerados": 0,
        }
    latest = _latest_state_per_course(pares_trajetoria)
    return {
        "taxa_conclusao_media_nacional": _safe_mean(latest["taxa_conclusao_acumulada"]),
        "taxa_desistencia_media_nacional": _safe_mean(
            latest["taxa_desistencia_acumulada"]
        ),
        "quantidade_cursos_considerados": int(latest["codigo_curso"].nunique()),
    }


def _latest_state_per_course(frame: pd.DataFrame) -> pd.DataFrame:
    """Para cada curso nacional, a coorte de ingresso mais recente.

    No seu ano de acompanhamento mais recente — mesma lógica de
    ``course_profile._latest_cohort_latest_year``, vetorizada para todos os
    cursos-pares de uma vez.
    """
    max_ingresso = frame.groupby("codigo_curso")["ano_ingresso"].transform("max")
    latest_cohort = frame[frame["ano_ingresso"] == max_ingresso]
    idx = latest_cohort.groupby("codigo_curso")["ano_referencia"].idxmax()
    return latest_cohort.loc[idx]


def _safe_mean(series: pd.Series) -> float | None:
    value = series.mean()
    return None if pd.isna(value) else round(float(value), 2)


def _distribuicao_cpc_faixa_nacional(
    pares_qualidade: pd.DataFrame,
) -> list[dict[str, object]]:
    """Contraparte nacional da distribuição: % de cursos-pares por faixa.

    Ano mais recente de cada curso, em percentual — não contagem, senão
    milhares de cursos nacionais sempre esmagariam os poucos do campus.
    """
    if pares_qualidade.empty:
        return []
    idx = pares_qualidade.groupby("codigo_curso")["ano"].idxmax()
    latest = pares_qualidade.loc[idx]
    counts = latest["cpc_faixa"].value_counts()
    total = int(counts.sum())
    if total == 0:
        return []
    return [
        {"cpc_faixa": faixa, "percentual_nacional": round(100 * int(count) / total, 1)}
        for faixa, count in counts.sort_index().items()
    ]


class NationalBenchmarksSection:
    """Médias nacionais do grupo de pares — implementa ``DashboardSection``.

    Só chama o ``build(qualidade_nacional, trajetoria_nacional, data)`` de
    nível de módulo (testado à parte).
    """

    key = "medias_nacionais"

    def build(self, context: DashboardContext) -> dict[str, object]:
        return build(
            context.qualidade_nacional, context.trajetoria_nacional, context.data
        )
