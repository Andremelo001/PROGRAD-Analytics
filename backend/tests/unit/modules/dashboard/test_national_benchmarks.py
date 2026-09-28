import pandas as pd

from app.modules.dashboard.domain.services import national_benchmarks
from app.modules.dashboard.domain.shared import ScopedData


def _peer_qualidade_row() -> pd.DataFrame:
    """Outra IES, mesma área de avaliação do curso 10 (Ciência da Computação)."""
    return pd.DataFrame(
        [
            {
                "codigo_ies": 7,
                "codigo_municipio": 500,
                "codigo_curso": 700,
                "ano": 2019,
                "area_avaliacao": "Ciência da Computação",
                "nome_ies": "Outra Federal",
                "sigla_ies": "OF",
                "cpc_continuo": 4.2,
                "cpc_faixa": "5",
                "conceito_enade_continuo": 4.3,
                "nota_padronizada_fg": 5.0,
                "nota_padronizada_ce": 5.0,
                "nota_padronizada_idd": 5.0,
                "nota_padronizada_org_didatico_pedagogica": 5.0,
                "nota_padronizada_infraestrutura": 5.0,
                "nota_padronizada_oportunidade_ampliacao": 5.0,
                "nota_padronizada_mestres": 5.0,
                "nota_padronizada_doutores": 5.0,
                "nota_padronizada_regime_trabalho": 5.0,
            }
        ]
    )


def _peer_trajetoria_row() -> pd.DataFrame:
    """Outra IES, mesma área CINE do curso 10, mesma coorte (2018/2019)."""
    return pd.DataFrame(
        [
            {
                "codigo_ies": 7,
                "codigo_municipio": 500,
                "codigo_curso": 700,
                "nome_curso": "Ciência da Computação",
                "nome_ies": "Outra Federal",
                "tp_grau_academico_desc": "Bacharelado",
                "tp_modalidade_ensino_desc": "Presencial",
                "nome_cine_area_geral": "Ciência da computação",
                "ano_ingresso": 2018,
                "ano_referencia": 2019,
                "qt_ingressante": 40,
                "qt_permanencia": 32,
                "qt_concluinte": 0,
                "qt_desistencia": 8,
                "qt_falecido": 0,
                "taxa_permanencia": 80.0,
                "taxa_conclusao_acumulada": 0.0,
                "taxa_desistencia_acumulada": 20.0,
                "taxa_desistencia_anual": 20.0,
            }
        ]
    )


def test_build_returns_all_sections(
    qualidade_raw: pd.DataFrame, trajetoria_raw: pd.DataFrame, scoped_data: ScopedData
) -> None:
    result = national_benchmarks.build(qualidade_raw, trajetoria_raw, scoped_data)
    assert set(result) == {
        "evolucao_cpc",
        "perfil_radar",
        "curva_sobrevivencia",
        "heatmap_evasao_anual",
        "campus",
    }


def test_excludes_areas_the_campus_does_not_offer(
    qualidade_raw: pd.DataFrame, trajetoria_raw: pd.DataFrame, scoped_data: ScopedData
) -> None:
    result = national_benchmarks.build(qualidade_raw, trajetoria_raw, scoped_data)
    areas = {row["area_avaliacao"] for row in result["evolucao_cpc"]}
    assert "Outra Instituição" not in areas  # área que o campus não oferece


def test_evolucao_cpc_averages_across_peer_institutions(
    qualidade_raw: pd.DataFrame, trajetoria_raw: pd.DataFrame, scoped_data: ScopedData
) -> None:
    nacional = pd.concat([qualidade_raw, _peer_qualidade_row()], ignore_index=True)
    result = national_benchmarks.build(nacional, trajetoria_raw, scoped_data)
    row = next(
        r
        for r in result["evolucao_cpc"]
        if r["area_avaliacao"] == "Ciência da Computação" and r["ano"] == 2019
    )
    # curso 10 (3.8) + curso-par de outra IES (4.2) -> média nacional 4.0
    assert row["cpc_continuo_medio_nacional"] == 4.0
    assert row["quantidade_cursos_considerados"] == 2


def test_perfil_radar_nacional_uses_latest_year_per_area(
    qualidade_raw: pd.DataFrame, trajetoria_raw: pd.DataFrame, scoped_data: ScopedData
) -> None:
    nacional = pd.concat([qualidade_raw, _peer_qualidade_row()], ignore_index=True)
    result = national_benchmarks.build(nacional, trajetoria_raw, scoped_data)
    row = next(
        r
        for r in result["perfil_radar"]
        if r["area_avaliacao"] == "Ciência da Computação"
    )
    # curso 10 no ano mais recente (2019, nota 4.0) + par (2019, nota 5.0) -> 4.5
    assert row["formacao_geral"] == 4.5


def test_curva_sobrevivencia_nacional_aligns_by_anos_desde_ingresso(
    qualidade_raw: pd.DataFrame, trajetoria_raw: pd.DataFrame, scoped_data: ScopedData
) -> None:
    nacional = pd.concat([trajetoria_raw, _peer_trajetoria_row()], ignore_index=True)
    result = national_benchmarks.build(qualidade_raw, nacional, scoped_data)
    # curso 10, coorte 2018, 1 ano depois do ingresso (ano_referencia 2019): 10%
    # par, coorte 2018, 1 ano depois do ingresso (ano_referencia 2019): 20%
    row = next(
        r
        for r in result["curva_sobrevivencia"]
        if r["nome_cine_area_geral"] == "Ciência da computação"
        and r["anos_desde_ingresso"] == 1
    )
    assert row["taxa_desistencia_acumulada_media_nacional"] == 15.0
    assert row["quantidade_cursos_considerados"] == 2


def test_heatmap_evasao_nacional_groups_by_area_and_ano_referencia(
    qualidade_raw: pd.DataFrame, trajetoria_raw: pd.DataFrame, scoped_data: ScopedData
) -> None:
    nacional = pd.concat([trajetoria_raw, _peer_trajetoria_row()], ignore_index=True)
    result = national_benchmarks.build(qualidade_raw, nacional, scoped_data)
    row = next(
        r
        for r in result["heatmap_evasao_anual"]
        if r["nome_cine_area_geral"] == "Ciência da computação"
        and r["ano_referencia"] == 2019
    )
    assert row["taxa_desistencia_anual_media_nacional"] == 15.0


def test_campus_nacional_kpis_and_distribuicao(
    qualidade_raw: pd.DataFrame, trajetoria_raw: pd.DataFrame, scoped_data: ScopedData
) -> None:
    result = national_benchmarks.build(qualidade_raw, trajetoria_raw, scoped_data)
    campus = result["campus"]
    assert set(campus) == {"kpis", "distribuicao_cpc_faixa"}
    assert campus["kpis"]["quantidade_cursos_considerados"] >= 1
    faixas = {row["cpc_faixa"] for row in campus["distribuicao_cpc_faixa"]}
    assert faixas <= {"4", "2"}  # só as faixas dos cursos-pares do campus


def test_build_handles_empty_national_frames(scoped_data: ScopedData) -> None:
    result = national_benchmarks.build(pd.DataFrame(), pd.DataFrame(), scoped_data)
    assert result["evolucao_cpc"] == []
    assert result["perfil_radar"] == []
    assert result["curva_sobrevivencia"] == []
    assert result["heatmap_evasao_anual"] == []
    assert result["campus"]["kpis"]["quantidade_cursos_considerados"] == 0
    assert result["campus"]["distribuicao_cpc_faixa"] == []
