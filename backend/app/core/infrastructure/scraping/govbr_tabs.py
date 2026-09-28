import re
from dataclasses import dataclass
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from bs4.element import Tag

_FILE_EXT_RE = re.compile(r"\.(?:zip|xlsx|xls|ods|docx)(?:$|\?)", re.IGNORECASE)


@dataclass(frozen=True, slots=True)
class Tab:
    label: str
    url: str


def parse_tabs(html: str, base_url: str) -> list[Tab]:
    """Extrai as abas (ano / faixa de anos) da página do INEP.

    Cada aba é um ``<div class="tab-content" data-id="..." data-url="...">``.
    """
    soup = BeautifulSoup(html, "lxml")
    tabs: list[Tab] = []
    seen: set[str] = set()
    for div in soup.select("div.tab-content[data-url]"):
        if not isinstance(div, Tag):
            continue
        raw_url = div.get("data-url")
        raw_id = div.get("data-id")
        if not isinstance(raw_url, str) or not raw_url.strip():
            continue
        url = urljoin(base_url, raw_url.strip())
        if url in seen:
            continue
        seen.add(url)
        label = raw_id.strip() if isinstance(raw_id, str) and raw_id.strip() else url
        tabs.append(Tab(label=label, url=url))
    return tabs


def parse_file_links(html: str, base_url: str) -> list[str]:
    """Extrai links de arquivo (.zip/.xlsx/.xls/.ods/.docx) de uma subpágina."""
    soup = BeautifulSoup(html, "lxml")
    links: list[str] = []
    seen: set[str] = set()
    for anchor in soup.find_all("a", href=True):
        if not isinstance(anchor, Tag):
            continue
        href = anchor.get("href")
        if not isinstance(href, str) or not _FILE_EXT_RE.search(href):
            continue
        url = urljoin(base_url, href.strip())
        if url not in seen:
            seen.add(url)
            links.append(url)
    return links
