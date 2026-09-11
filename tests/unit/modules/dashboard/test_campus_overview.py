from app.modules.dashboard.domain.services import campus_overview, course_profile
from app.modules.dashboard.domain.shared import ScopedData


def test_build_returns_kpis_and_distribuicao(scoped_data: ScopedData) -> None:
    kpis_por_curso = course_profile.build_kpis_por_curso(scoped_data)
    result = campus_overview.build(scoped_data, kpis_por_curso)
    assert set(result) == {"kpis", "distribuicao_cpc_faixa"}


def test_kpis_campus_totals(scoped_data: ScopedData) -> None:
    kpis_por_curso = course_profile.build_kpis_por_curso(scoped_data)
    kpis = campus_overview.build(scoped_data, kpis_por_curso)["kpis"]

    assert kpis["total_cursos"] == 3
    # último ano de ingresso no campus é 2020 (curso 10, coorte de 60)
    assert kpis["total_ingressantes_ultimo_ano"] == 60

    # média das taxas de conclusão/desistência acumuladas das coortes mais
    # recentes de cada curso: 10 -> 0.0 (2020), 30 -> 6.7 (2019); 20 não tem
    # trajetória e é ignorado.
    assert kpis["taxa_conclusao_media"] == 0.0
    assert kpis["taxa_desistencia_media"] == 3.35


def test_distribuicao_cpc_faixa_counts_courses_per_faixa(
    scoped_data: ScopedData,
) -> None:
    kpis_por_curso = course_profile.build_kpis_por_curso(scoped_data)
    distribuicao = campus_overview.build(scoped_data, kpis_por_curso)[
        "distribuicao_cpc_faixa"
    ]
    counts = {row["cpc_faixa"]: row["quantidade_cursos"] for row in distribuicao}
    # curso 10 -> faixa 4 (ano mais recente, 2019), curso 20 -> faixa 2; curso
    # 30 não tem qualidade e não entra na distribuição.
    assert counts == {"4": 1, "2": 1}
