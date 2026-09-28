from app.modules.dashboard.domain.services import course_comparison
from app.modules.dashboard.domain.shared import ScopedData


def test_build_returns_all_sections(scoped_data: ScopedData) -> None:
    result = course_comparison.build(scoped_data)
    assert set(result) == {
        "ranking_cpc",
        "tabela_comparativa",
        "notas_por_dimensao",
        "evolucao_cpc_comparada",
    }


def test_ranking_cpc_sorted_descending_by_latest_cpc(scoped_data: ScopedData) -> None:
    ranking = course_comparison.build(scoped_data)["ranking_cpc"]
    assert [r["codigo_curso"] for r in ranking] == [10, 20]
    assert ranking[0]["cpc_continuo"] == 3.8  # curso 10, ano mais recente (2019)


def test_tabela_comparativa_has_one_row_per_curso_with_expected_keys(
    scoped_data: ScopedData,
) -> None:
    tabela = course_comparison.build(scoped_data)["tabela_comparativa"]
    assert {row["codigo_curso"] for row in tabela} == {10, 20, 30}
    assert set(tabela[0]) == {
        "codigo_curso",
        "nome_curso",
        "cpc_faixa",
        "conceito_enade_continuo",
        "taxa_conclusao_acumulada",
        "taxa_desistencia_acumulada",
        "taxa_permanencia",
    }
