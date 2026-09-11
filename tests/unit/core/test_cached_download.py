from pathlib import Path

from app.core.domain.value_objects.remote_file_meta import RemoteFileMeta
from app.core.infrastructure.http.cached_download import resolve_downloads
from app.core.infrastructure.storage.raw_cache import RawCacheManifest


class _FakeClient:
    def __init__(self, metas: dict[str, RemoteFileMeta]) -> None:
        self._metas = metas
        self.downloaded: list[str] = []

    def head_many(self, urls, *, max_workers=None):
        return [self._metas[url] for url in urls]

    def download_many(self, items, *, force=False, max_workers=None):
        paths = []
        for url, dest in items:
            self.downloaded.append(url)
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text("conteudo", encoding="utf-8")
            paths.append(dest)
        return paths


def _dest_for(base: Path):
    return lambda key, url: base / key / url.rsplit("/", 1)[-1]


def test_downloads_new_files_and_records_manifest(tmp_path: Path):
    meta = RemoteFileMeta(etag='"a"', last_modified=None, content_length=8)
    client = _FakeClient({"https://x/2023.xlsx": meta})
    manifest = RawCacheManifest(tmp_path)

    resolved = resolve_downloads(
        client,
        manifest,
        [("2023", "https://x/2023.xlsx")],
        _dest_for(tmp_path),
        force=False,
    )

    assert client.downloaded == ["https://x/2023.xlsx"]
    (path, changed) = resolved[0]
    assert changed is True
    assert path.exists()
    assert manifest.is_fresh("2023", "https://x/2023.xlsx", meta) is True


def test_skips_download_when_cache_is_fresh(tmp_path: Path):
    meta = RemoteFileMeta(etag='"a"', last_modified=None, content_length=8)
    client = _FakeClient({"https://x/2023.xlsx": meta})
    manifest = RawCacheManifest(tmp_path)
    dest = tmp_path / "2023" / "2023.xlsx"
    dest.parent.mkdir(parents=True)
    dest.write_text("ja tenho", encoding="utf-8")
    manifest.record("2023", "https://x/2023.xlsx", meta)
    manifest.save()

    resolved = resolve_downloads(
        client,
        manifest,
        [("2023", "https://x/2023.xlsx")],
        _dest_for(tmp_path),
        force=False,
    )

    assert client.downloaded == []
    (path, changed) = resolved[0]
    assert changed is False
    assert path == dest


def test_force_redownloads_even_if_fresh(tmp_path: Path):
    meta = RemoteFileMeta(etag='"a"', last_modified=None, content_length=8)
    client = _FakeClient({"https://x/2023.xlsx": meta})
    manifest = RawCacheManifest(tmp_path)
    dest = tmp_path / "2023" / "2023.xlsx"
    dest.parent.mkdir(parents=True)
    dest.write_text("ja tenho", encoding="utf-8")
    manifest.record("2023", "https://x/2023.xlsx", meta)
    manifest.save()

    resolved = resolve_downloads(
        client,
        manifest,
        [("2023", "https://x/2023.xlsx")],
        _dest_for(tmp_path),
        force=True,
    )

    assert client.downloaded == ["https://x/2023.xlsx"]
    assert resolved[0][1] is True
