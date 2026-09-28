from collections.abc import Callable, Sequence
from pathlib import Path

from app.core.infrastructure.http.inep_client import InepClient
from app.core.infrastructure.storage.raw_cache import RawCacheManifest


def resolve_downloads(
    client: InepClient,
    manifest: RawCacheManifest,
    plan: Sequence[tuple[str, str]],
    dest_for: Callable[[str, str], Path],
    *,
    force: bool,
) -> list[tuple[Path, bool]]:
    """Decide, por item de ``plan`` (chave, url), cache local vs. novo download.

    Faz ``HEAD`` em paralelo para todos os itens; baixa (em paralelo) só os
    que mudaram ou ainda não tinham cache; atualiza e salva o manifesto.
    Retorna ``(caminho, changed)`` na mesma ordem de ``plan``.
    """
    if not plan:
        return []

    metas = client.head_many([url for _, url in plan])
    dests = [dest_for(key, url) for key, url in plan]

    to_fetch = [
        index
        for index, ((key, url), meta, dest) in enumerate(
            zip(plan, metas, dests, strict=True)
        )
        if force or not dest.exists() or not manifest.is_fresh(key, url, meta)
    ]

    if to_fetch:
        items = [(plan[index][1], dests[index]) for index in to_fetch]
        fetched = client.download_many(items, force=True)
        for index, path in zip(to_fetch, fetched, strict=True):
            dests[index] = path
            key, url = plan[index]
            manifest.record(key, url, metas[index])
        manifest.save()

    changed = set(to_fetch)
    return [(dests[index], index in changed) for index in range(len(plan))]
