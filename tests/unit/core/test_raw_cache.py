from pathlib import Path

from app.core.domain.value_objects.remote_file_meta import RemoteFileMeta
from app.core.infrastructure.storage.raw_cache import RawCacheManifest


def test_unknown_key_is_never_fresh(tmp_path: Path):
    manifest = RawCacheManifest(tmp_path)
    meta = RemoteFileMeta(etag="a", last_modified=None, content_length=None)
    assert manifest.is_fresh("2023", "https://x/a.xlsx", meta) is False


def test_record_and_reload_roundtrip(tmp_path: Path):
    meta = RemoteFileMeta(etag='"abc"', last_modified="X", content_length=10)
    manifest = RawCacheManifest(tmp_path)
    manifest.record("2023", "https://x/a.xlsx", meta)
    manifest.save()

    reloaded = RawCacheManifest(tmp_path)
    assert reloaded.is_fresh("2023", "https://x/a.xlsx", meta) is True
    # url diferente para a mesma chave -> não é fresh, mesmo com o mesmo meta
    assert reloaded.is_fresh("2023", "https://x/b.xlsx", meta) is False
    # meta diferente para a mesma url -> não é fresh
    changed = RemoteFileMeta(etag='"zzz"', last_modified="X", content_length=10)
    assert reloaded.is_fresh("2023", "https://x/a.xlsx", changed) is False


def test_corrupted_manifest_is_ignored(tmp_path: Path):
    (tmp_path / "_manifest.json").write_text("{ not json", encoding="utf-8")
    manifest = RawCacheManifest(tmp_path)
    meta = RemoteFileMeta(etag="a", last_modified=None, content_length=None)
    assert manifest.is_fresh("2023", "https://x/a.xlsx", meta) is False
