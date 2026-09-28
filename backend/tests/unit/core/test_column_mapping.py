import json
from pathlib import Path

import pytest

from app.core.config.column_mapping import (
    ColumnMappingError,
    ModuleColumnMapping,
    load_column_mapping,
)


def _write(tmp_path: Path, content: object) -> Path:
    path = tmp_path / "colunas_inep.json"
    text = content if isinstance(content, str) else json.dumps(content)
    path.write_text(text, encoding="utf-8")
    return path


def test_loads_section_and_converts_category_codes_to_int(tmp_path: Path):
    path = _write(
        tmp_path,
        {
            "_leia_me": ["instruções ignoradas pelo sistema"],
            "mod": {
                "colunas": {"ano": ["Ano", "Edição"]},
                "categorias": {"ano": {"1": "Um", "2": "Dois"}},
            },
        },
    )
    mapping = load_column_mapping("mod", path=path)
    assert mapping.colunas == {"ano": ["Ano", "Edição"]}
    assert mapping.categorias == {"ano": {1: "Um", 2: "Dois"}}


def test_categorias_is_optional(tmp_path: Path):
    path = _write(tmp_path, {"mod": {"colunas": {"ano": ["Ano"]}}})
    assert load_column_mapping("mod", path=path).categorias == {}


def test_missing_file(tmp_path: Path):
    with pytest.raises(ColumnMappingError, match="não encontrado"):
        load_column_mapping("mod", path=tmp_path / "nao_existe.json")


def test_invalid_json_points_to_line(tmp_path: Path):
    path = _write(tmp_path, '{\n  "mod": {\n    "colunas": {"ano": ["Ano",]}\n  }\n}')
    with pytest.raises(ColumnMappingError, match="JSON inválido na linha 3"):
        load_column_mapping("mod", path=path)


def test_missing_section(tmp_path: Path):
    path = _write(tmp_path, {"outro": {"colunas": {}}})
    with pytest.raises(ColumnMappingError, match="seção 'mod' não encontrada"):
        load_column_mapping("mod", path=path)


def test_empty_name_list_rejected(tmp_path: Path):
    path = _write(tmp_path, {"mod": {"colunas": {"ano": []}}})
    with pytest.raises(ColumnMappingError, match=r"colunas\.ano"):
        load_column_mapping("mod", path=path)


def test_blank_name_rejected(tmp_path: Path):
    path = _write(tmp_path, {"mod": {"colunas": {"ano": ["   "]}}})
    with pytest.raises(ColumnMappingError, match=r"colunas\.ano\.0"):
        load_column_mapping("mod", path=path)


def test_unknown_key_in_section_rejected(tmp_path: Path):
    path = _write(tmp_path, {"mod": {"colunas": {"ano": ["Ano"]}, "colunaz": {}}})
    with pytest.raises(ColumnMappingError, match="colunaz"):
        load_column_mapping("mod", path=path)


def _mapping(tmp_path: Path, section: dict) -> ModuleColumnMapping:
    return load_column_mapping("mod", path=_write(tmp_path, {"mod": section}))


def test_fingerprint_ignores_key_order_and_formatting(tmp_path: Path):
    a = _mapping(tmp_path, {"colunas": {"a": ["A"], "b": ["B"]}})
    b = _mapping(tmp_path, {"colunas": {"b": ["B"], "a": ["A"]}})
    assert a.fingerprint() == b.fingerprint()


def test_fingerprint_changes_when_a_name_is_added(tmp_path: Path):
    before = _mapping(tmp_path, {"colunas": {"a": ["A"]}})
    after = _mapping(tmp_path, {"colunas": {"a": ["A novo", "A"]}})
    assert before.fingerprint() != after.fingerprint()


def test_fingerprint_changes_when_a_category_label_changes(tmp_path: Path):
    base = {"colunas": {"a": ["A"]}}
    before = _mapping(tmp_path, {**base, "categorias": {"a": {"1": "Um"}}})
    after = _mapping(tmp_path, {**base, "categorias": {"a": {"1": "Uno"}}})
    assert before.fingerprint() != after.fingerprint()
