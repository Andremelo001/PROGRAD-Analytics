from app.core.infrastructure.scraping.govbr_tabs import parse_file_links, parse_tabs

_LANDING_HTML = """
<div class="tabs-content">
  <div class="tab-content" data-id="2023" data-url="https://x/dados/2023"><p>loading</p></div>
  <div class="tab-content" data-id="2022" data-url="/dados/2022"></div>
  <div class="tab-content" data-id="Sobre" data-url="https://x/dados/sobre"></div>
</div>
"""

_SUBPAGE_HTML = """
<a href="https://download.inep.gov.br/a/CPC_2023.xlsx">cpc</a>
<a href="https://download.inep.gov.br/a/IDD_2023.ods">idd</a>
<a href="/rel/indicadores_trajetoria_es_2023.zip">zip</a>
<a href="https://x/outra-pagina">pagina</a>
"""


def test_parse_tabs_resolves_relative_urls():
    tabs = parse_tabs(_LANDING_HTML, "https://x/base/page")
    assert [t.label for t in tabs] == ["2023", "2022", "Sobre"]
    assert tabs[1].url == "https://x/dados/2022"


def test_parse_file_links_filters_by_extension():
    links = parse_file_links(_SUBPAGE_HTML, "https://x/base/page")
    assert "https://download.inep.gov.br/a/CPC_2023.xlsx" in links
    assert "https://download.inep.gov.br/a/IDD_2023.ods" in links
    assert "https://x/rel/indicadores_trajetoria_es_2023.zip" in links
    assert "https://x/outra-pagina" not in links
    assert len(links) == 3
