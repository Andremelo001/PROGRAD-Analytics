import re
import unicodedata

# hifens tipograficos (U+2010..U+2015) e sinal de menos (U+2212) -> "-"
_DASH_TRANSLATION = {codepoint: "-" for codepoint in (*range(0x2010, 0x2016), 0x2212)}
_WS_RE = re.compile(r"\s+")
_TRAILING_STARS_RE = re.compile(r"\*+$")


def _strip_accents(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(char for char in decomposed if not unicodedata.combining(char))


def normalize_key(value: object) -> str:
    """Normaliza um rótulo para casar cabeçalho do arquivo x 'Nome Original'.

    Remove acentos -> unifica travessões -> colapsa espaços -> remove ``*``
    finais (notas de rodapé, ex.: ``Código da IES*``) -> ``strip`` -> ``casefold``.
    Isso faz, por exemplo, ``"Código da IES"`` e ``"Codigo da IES"`` casarem.
    """
    text = "" if value is None else str(value)
    text = _strip_accents(text)
    text = text.translate(_DASH_TRANSLATION)
    text = _WS_RE.sub(" ", text).strip()
    text = _TRAILING_STARS_RE.sub("", text).strip()
    return text.casefold()
