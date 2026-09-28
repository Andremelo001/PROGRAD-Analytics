import pytest
from pydantic import BaseModel

from app.core.config.column_mapping import load_column_mapping
from app.core.domain.pipelines.schema import (
    SchemaMappingError,
    model_to_specs,
    validate_category_columns,
)
from app.modules.qualidade.domain.schema import CpcRow
from app.modules.trajetoria.domain.schema import TrajetoriaRow


class _Row(BaseModel):
    ano: int
    nome: str


# --- colunas_inep.json real: garante que o arquivo versionado cobre os schemas


def test_real_mapping_covers_cpc_schema():
    mapping = load_column_mapping("qualidade")
    by_norm = {s.normalized: s for s in model_to_specs(CpcRow, mapping.colunas)}
    assert len(by_norm) == 38
    assert by_norm["ano"].dtype == "int"
    assert by_norm["nota_bruta_fg"].dtype == "float"
    assert by_norm["cpc_faixa"].dtype == "string"
    assert by_norm["cpc_faixa"].original == "CPC (Faixa)"
    assert by_norm["ano"].aliases == ("Ano", "Edição")


def test_real_mapping_covers_trajetoria_schema():
    mapping = load_column_mapping("trajetoria")
    specs = model_to_specs(TrajetoriaRow, mapping.colunas)
    validate_category_columns(specs, mapping.categorias)
    by_norm = {s.normalized: s for s in specs}
    assert len(by_norm) == 31
    assert by_norm["codigo_cine_area_geral"].dtype == "string"
    assert by_norm["taxa_permanencia"].dtype == "float"
    assert by_norm["codigo_ies"].original == "Código da Instituição"
    assert mapping.categorias["tp_grau_academico"][1] == "Bacharelado"


# --- coerência nomes externos x schema


def test_model_to_specs_uses_external_names_in_order():
    specs = model_to_specs(_Row, {"ano": ["Ano", "Edição"], "nome": ["Nome"]})
    assert [s.normalized for s in specs] == ["ano", "nome"]
    assert specs[0].aliases == ("Ano", "Edição")
    assert specs[0].original == "Ano"


def test_model_to_specs_rejects_missing_column():
    with pytest.raises(SchemaMappingError, match="sem nome definido: nome"):
        model_to_specs(_Row, {"ano": ["Ano"]}, context="colunas_inep.json [x]")


def test_model_to_specs_rejects_unknown_internal_name():
    with pytest.raises(SchemaMappingError, match="desconhecidos.*nme"):
        model_to_specs(_Row, {"ano": ["Ano"], "nome": ["Nome"], "nme": ["Nome"]})


def test_model_to_specs_error_mentions_context():
    with pytest.raises(SchemaMappingError, match=r"^colunas_inep.json \[x\]: "):
        model_to_specs(_Row, {}, context="colunas_inep.json [x]")


def test_validate_category_columns_rejects_unknown_and_non_int():
    specs = model_to_specs(_Row, {"ano": ["Ano"], "nome": ["Nome"]})
    validate_category_columns(specs, {"ano": {1: "x"}})  # ok
    with pytest.raises(SchemaMappingError, match="coluna desconhecida: xpto"):
        validate_category_columns(specs, {"xpto": {1: "x"}})
    with pytest.raises(SchemaMappingError, match="não numérica: nome"):
        validate_category_columns(specs, {"nome": {1: "x"}})
