import ssl
import time
from collections.abc import Callable, Sequence
from concurrent.futures import Future, ThreadPoolExecutor
from pathlib import Path
from types import TracebackType
from typing import Self, TypeVar

import certifi
import httpx
from loguru import logger

from app.core.config.settings import settings
from app.core.domain.value_objects.remote_file_meta import RemoteFileMeta

_RETRYABLE_STATUS = frozenset({429, 500, 502, 503, 504})
_T = TypeVar("_T")

# download.inep.gov.br serve cadeia TLS incompleta (omite a intermediária da RNP).
_EXTRA_CA_CHAIN = Path(__file__).parent / "certs" / "inep_ca_chain.pem"


def _build_ssl_context() -> ssl.SSLContext:
    context = ssl.create_default_context(cafile=certifi.where())
    if _EXTRA_CA_CHAIN.exists():
        context.load_verify_locations(cafile=str(_EXTRA_CA_CHAIN))
    return context


class InepClient:
    """Cliente HTTP para o INEP: busca HTML, checa e baixa arquivos.

    Todas as operações de rede têm retry simples com backoff; as variantes
    ``*_many`` rodam em paralelo (threads) — ``httpx.Client`` é seguro para
    uso concorrente.
    """

    def __init__(
        self,
        *,
        timeout: float | None = None,
        user_agent: str | None = None,
        max_retries: int | None = None,
        backoff: float | None = None,
    ) -> None:
        self._max_retries = (
            max_retries if max_retries is not None else settings.http_max_retries
        )
        self._backoff = backoff if backoff is not None else settings.http_backoff
        self._client = httpx.Client(
            follow_redirects=True,
            timeout=timeout if timeout is not None else settings.http_timeout,
            headers={"User-Agent": user_agent or settings.http_user_agent},
            verify=_build_ssl_context(),
        )

    def __enter__(self) -> Self:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        self.close()

    def close(self) -> None:
        self._client.close()

    def get_text(self, url: str) -> str:
        for attempt in range(1, self._max_retries + 1):
            try:
                response = self._client.get(url)
                response.raise_for_status()
            except httpx.HTTPError as err:
                self._retry_or_raise(attempt, url, err)
            else:
                return response.text
        msg = f"GET falhou após {self._max_retries} tentativas: {url}"
        raise RuntimeError(msg)

    def head(self, url: str) -> RemoteFileMeta:
        """Consulta ``ETag``/``Last-Modified``/tamanho sem baixar o corpo."""
        for attempt in range(1, self._max_retries + 1):
            try:
                response = self._client.head(url)
                response.raise_for_status()
            except httpx.HTTPError as err:
                self._retry_or_raise(attempt, url, err)
            else:
                length = response.headers.get("content-length")
                return RemoteFileMeta(
                    etag=response.headers.get("etag"),
                    last_modified=response.headers.get("last-modified"),
                    content_length=int(length) if length is not None else None,
                )
        msg = f"HEAD falhou após {self._max_retries} tentativas: {url}"
        raise RuntimeError(msg)

    def head_many(
        self, urls: Sequence[str], *, max_workers: int | None = None
    ) -> list[RemoteFileMeta]:
        calls = [lambda u=url: self.head(u) for url in urls]
        return self._gather(calls, max_workers=max_workers)

    def download(self, url: str, dest: Path, *, force: bool = False) -> Path:
        if dest.exists() and not force:
            logger.info("cache hit | {}", dest.name)
            return dest
        dest.parent.mkdir(parents=True, exist_ok=True)
        tmp = dest.with_name(dest.name + ".part")
        for attempt in range(1, self._max_retries + 1):
            try:
                with self._client.stream("GET", url) as response:
                    response.raise_for_status()
                    with tmp.open("wb") as handle:
                        for chunk in response.iter_bytes():
                            handle.write(chunk)
                tmp.replace(dest)
            except httpx.HTTPError as err:
                tmp.unlink(missing_ok=True)
                self._retry_or_raise(attempt, url, err)
            else:
                logger.info("downloaded | {} <- {}", dest.name, url)
                return dest
        msg = f"download falhou após {self._max_retries} tentativas: {url}"
        raise RuntimeError(msg)

    def download_many(
        self,
        items: Sequence[tuple[str, Path]],
        *,
        force: bool = False,
        max_workers: int | None = None,
    ) -> list[Path]:
        """Baixa vários arquivos em paralelo.

        ``max_workers=None`` (padrão) dispara todos de uma vez, cada um com o
        retry de ``download``. Retorna na mesma ordem de ``items``; propaga a
        primeira falha definitiva.
        """
        calls = [
            lambda u=url, d=dest: self.download(u, d, force=force)
            for url, dest in items
        ]
        return self._gather(calls, max_workers=max_workers)

    def _gather(
        self,
        calls: Sequence[Callable[[], _T]],
        *,
        max_workers: int | None,
    ) -> list[_T]:
        if not calls:
            return []
        workers = max_workers if max_workers is not None else len(calls)
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures: list[Future[_T]] = [pool.submit(call) for call in calls]
            return [future.result() for future in futures]

    def _retry_or_raise(self, attempt: int, url: str, err: httpx.HTTPError) -> None:
        if attempt >= self._max_retries:
            logger.error("falha definitiva | {} | {}", url, err)
            raise err
        wait = self._backoff**attempt
        logger.warning(
            "tentativa {}/{} falhou ({}); retry em {:.1f}s",
            attempt,
            self._max_retries,
            err,
            wait,
        )
        time.sleep(wait)
