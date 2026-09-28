from pathlib import Path

from app.core.domain.value_objects.raw_file import RawFile
from app.core.infrastructure.readers.spreadsheet_reader import SpreadsheetReader


def _raw(path: Path) -> RawFile:
    return RawFile(module="m", year_label="y", source_url="u", path=path)


def test_picks_data_sheet_and_header_row_zero(cpc_xlsx):
    reader = SpreadsheetReader(
        sheet_patterns=["cpc"],
        expected_labels=["Ano", "Código da IES", "Nome da IES", "CPC (Faixa)"],
    )
    frame = reader.read(_raw(cpc_xlsx))
    assert list(frame.columns)[:2] == ["Ano", "Código da IES"]
    assert "Coluna Extra" in frame.columns
    assert len(frame) == 3


def test_detects_header_row_block_and_split_header(trajetoria_xlsx):
    reader = SpreadsheetReader(
        sheet_patterns=["trajetoria", "indicadores"],
        expected_labels=[
            "Código da Instituição",
            "Ano de Ingresso",
            "Taxa de Permanência - TAP",
        ],
        header_block_rows=3,
    )
    frame = reader.read(_raw(trajetoria_xlsx))
    assert list(frame.columns) == [
        "Código da Instituição",
        "Ano de Ingresso",
        "Taxa de Permanência - TAP",
    ]
    assert len(frame) == 2
    assert frame.iloc[0].tolist() == [1, 2019, 98.5]
