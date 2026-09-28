from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class RemoteFileMeta:
    """Metadados HTTP (``ETag``/``Last-Modified``/tamanho) de um arquivo remoto."""

    etag: str | None
    last_modified: str | None
    content_length: int | None

    def matches(self, other: "RemoteFileMeta") -> bool:
        """True se ``other`` representa o mesmo conteúdo.

        Prioriza o ``ETag`` (identificador exato do servidor); quando um dos
        dois não tem ``ETag``, cai para ``Last-Modified`` + tamanho.
        """
        if self.etag and other.etag:
            return self.etag == other.etag
        return (
            self.last_modified == other.last_modified
            and self.content_length == other.content_length
        )
