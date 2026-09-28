from app.modules.dashboard.domain.section import DashboardContext
from app.modules.dashboard.domain.services import course_profile
from app.modules.dashboard.domain.shared import ScopedData, records


def build(
    data: ScopedData, kpis_por_curso: list[dict[str, object]]
) -> dict[str, object]:
    """Visão agregada do campus (todos os cursos juntos)."""
    return {
        "kpis": _kpis_campus(data, kpis_por_curso),
        "distribuicao_cpc_faixa": _distribuicao_cpc_faixa(kpis_por_curso),
        "tendencia_ingressantes": _tendencia_ingressantes(data),
    }


def _kpis_campus(
    data: ScopedData, kpis_por_curso: list[dict[str, object]]
) -> dict[str, object]:
    total_ingressantes = None
    if not data.trajetoria.empty:
        ultimo_ano = data.trajetoria["ano_ingresso"].max()
        primeira_linha = data.trajetoria[
            (data.trajetoria["ano_ingresso"] == ultimo_ano)
            & (data.trajetoria["ano_referencia"] == ultimo_ano)
        ]
        total_ingressantes = int(primeira_linha["qt_ingressante"].sum())

    conclusao: list[float] = [
        float(row["taxa_conclusao_acumulada"])  # type: ignore[arg-type]
        for row in kpis_por_curso
        if row["taxa_conclusao_acumulada"] is not None
    ]
    desistencia: list[float] = [
        float(row["taxa_desistencia_acumulada"])  # type: ignore[arg-type]
        for row in kpis_por_curso
        if row["taxa_desistencia_acumulada"] is not None
    ]

    return {
        "total_cursos": len(kpis_por_curso),
        "total_ingressantes_ultimo_ano": total_ingressantes,
        "taxa_conclusao_media": (
            round(sum(conclusao) / len(conclusao), 2) if conclusao else None
        ),
        "taxa_desistencia_media": (
            round(sum(desistencia) / len(desistencia), 2) if desistencia else None
        ),
    }


def _tendencia_ingressantes(data: ScopedData) -> list[dict[str, object]]:
    """Total de ingressantes do campus por ano de ingresso.

    Soma de todos os cursos, pra ver a tendência ao longo do tempo. Mesma
    dedup de ``trajectory_comparison._demanda_ingressantes`` (só a 1ª linha
    de cada coorte), só que somado entre cursos em vez de por curso.
    """
    if data.trajetoria.empty:
        return []
    primeira_linha = data.trajetoria[
        data.trajetoria["ano_referencia"] == data.trajetoria["ano_ingresso"]
    ]
    grouped = (
        primeira_linha.groupby("ano_ingresso")["qt_ingressante"]
        .sum()
        .reset_index()
        .sort_values("ano_ingresso")
    )
    return records(grouped)


def _distribuicao_cpc_faixa(
    kpis_por_curso: list[dict[str, object]]
) -> list[dict[str, object]]:
    counts: dict[object, int] = {}
    for row in kpis_por_curso:
        faixa = row.get("cpc_faixa")
        if faixa is None:
            continue
        counts[faixa] = counts.get(faixa, 0) + 1
    return [
        {"cpc_faixa": faixa, "quantidade_cursos": count}
        for faixa, count in sorted(counts.items())
    ]


class CampusOverviewSection:
    """Visão agregada do campus — implementa ``DashboardSection``.

    Recalcula ``kpis_por_curso`` (dataset já recortado, custo desprezível) e
    chama o ``build(data, kpis_por_curso)`` de nível de módulo (testado à
    parte).
    """

    key = "campus"

    def build(self, context: DashboardContext) -> dict[str, object]:
        kpis_por_curso = course_profile.build_kpis_por_curso(context.data)
        return build(context.data, kpis_por_curso)
