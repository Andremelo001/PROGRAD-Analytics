from pathlib import Path

from app.core.infrastructure.storage.meta_writer import (
    DatasetMeta,
    MetaWriter,
    read_meta,
    read_previous_fingerprint,
)


def test_read_meta_returns_empty_dict_when_file_missing(tmp_path: Path) -> None:
    assert read_meta(out_dir=tmp_path) == {}


def test_read_meta_roundtrips_with_meta_writer(tmp_path: Path) -> None:
    MetaWriter(out_dir=tmp_path).upsert(
        DatasetMeta(name="qualidade", file="qualidade.csv", rows=123)
    )
    loaded = read_meta(out_dir=tmp_path)
    assert loaded["qualidade"]["rows"] == 123
    assert loaded["qualidade"]["file"] == "qualidade.csv"
    assert loaded["qualidade"]["generated_at"]  # preenchido automaticamente


def test_read_meta_keeps_multiple_modules(tmp_path: Path) -> None:
    writer = MetaWriter(out_dir=tmp_path)
    writer.upsert(DatasetMeta(name="qualidade", file="qualidade.csv", rows=1))
    writer.upsert(DatasetMeta(name="trajetoria", file="trajetoria.csv.gz", rows=2))
    loaded = read_meta(out_dir=tmp_path)
    assert set(loaded) == {"qualidade", "trajetoria"}


def test_read_meta_ignores_invalid_json(tmp_path: Path) -> None:
    (tmp_path / "_meta.json").write_text("{ not json", encoding="utf-8")
    assert read_meta(out_dir=tmp_path) == {}


def test_read_meta_ignores_valid_json_that_is_not_a_dict(tmp_path: Path) -> None:
    (tmp_path / "_meta.json").write_text("[1, 2, 3]", encoding="utf-8")
    assert read_meta(out_dir=tmp_path) == {}


def test_read_previous_fingerprint(tmp_path: Path) -> None:
    assert read_previous_fingerprint("qualidade", out_dir=tmp_path) is None
    MetaWriter(out_dir=tmp_path).upsert(
        DatasetMeta(
            name="qualidade", file="q.csv", rows=1, mapping_fingerprint="abc123"
        )
    )
    assert read_previous_fingerprint("qualidade", out_dir=tmp_path) == "abc123"
    assert read_previous_fingerprint("trajetoria", out_dir=tmp_path) is None
