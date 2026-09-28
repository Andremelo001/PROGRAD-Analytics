from app.core.domain.normalization import normalize_key

_EN_DASH = chr(0x2013)
_EM_DASH = chr(0x2014)


def test_unifies_dashes_spaces_and_case():
    assert normalize_key(f"  Nota Bruta  {_EN_DASH} FG ") == "nota bruta - fg"
    assert normalize_key(f"Nota Bruta {_EM_DASH} IDD") == "nota bruta - idd"


def test_handles_none():
    assert normalize_key(None) == ""


def test_strips_accents_and_collapses_spaces():
    assert normalize_key("Código  da   IES") == "codigo da ies"


def test_accented_and_plain_versions_match():
    assert normalize_key("Código da IES") == normalize_key("Codigo da IES")
    assert normalize_key("Situação") == normalize_key("situacao")


def test_strips_trailing_footnote_stars():
    assert normalize_key("Código da IES*") == normalize_key("Código da IES")
    assert normalize_key("Código do Curso**") == normalize_key("Código do Curso")
