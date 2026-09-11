from app.core.domain.pipelines.schema import model_to_specs
from app.modules.qualidade.domain.schema import CpcRow
from app.modules.trajetoria.domain.schema import TrajetoriaRow


def test_cpc_specs():
    by_norm = {s.normalized: s for s in model_to_specs(CpcRow)}
    assert len(by_norm) == 38
    assert by_norm["ano"].dtype == "int"
    assert by_norm["nota_bruta_fg"].dtype == "float"
    assert by_norm["cpc_faixa"].dtype == "string"
    assert by_norm["cpc_faixa"].original == "CPC (Faixa)"


def test_trajetoria_specs():
    by_norm = {s.normalized: s for s in model_to_specs(TrajetoriaRow)}
    assert len(by_norm) == 31
    assert by_norm["codigo_cine_area_geral"].dtype == "string"
    assert by_norm["codigo_cine_rotulo"].dtype == "string"
    assert by_norm["taxa_permanencia"].dtype == "float"
    assert by_norm["codigo_ies"].original == "Código da Instituição"
