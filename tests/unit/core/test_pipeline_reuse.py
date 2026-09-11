from dataclasses import replace
from pathlib import Path

import pandas as pd

from app.core.domain.interfaces.transformer import TransformResult
from app.core.domain.pipelines.pipeline import DataPipeline
from app.core.domain.pipelines.report import FileReport
from app.core.domain.value_objects.raw_file import RawFile

_RAW = RawFile(module="m", year_label="2023", source_url="u", path=Path("x.xlsx"))


class _FakeSource:
    def __init__(self, raw_files: list[RawFile]) -> None:
        self._raw_files = raw_files

    def collect(self, *, years=None, force=False):
        return list(self._raw_files)


class _FakeReader:
    def read(self, raw: RawFile) -> pd.DataFrame:
        return pd.DataFrame({"a": [1]})


class _FakeTransformer:
    def transform(self, frame: pd.DataFrame, raw: RawFile) -> TransformResult:
        return TransformResult(
            frame=frame, report=FileReport(raw_file=raw, rows_in=1, rows_out=1)
        )


class _FakeExporter:
    def __init__(self, existing: Path | None) -> None:
        self._existing = existing
        self.export_calls = 0

    def exists(self, name: str) -> Path | None:
        return self._existing

    def export(self, frame: pd.DataFrame, name: str) -> Path:
        self.export_calls += 1
        return Path(f"{name}.csv")


def _pipeline(exporter: _FakeExporter, raw_files: list[RawFile]) -> DataPipeline:
    return DataPipeline(
        module="m",
        source=_FakeSource(raw_files),
        reader=_FakeReader(),
        transformer=_FakeTransformer(),
        exporter=exporter,
    )


def test_skips_regeneration_when_nothing_changed_and_output_exists():
    exporter = _FakeExporter(existing=Path("m.csv"))
    unchanged = replace(_RAW, changed=False)
    report = _pipeline(exporter, [unchanged]).run()

    assert report.reused is True
    assert report.output_path == Path("m.csv")
    assert exporter.export_calls == 0


def test_rebuilds_when_something_changed():
    exporter = _FakeExporter(existing=Path("m.csv"))
    changed = replace(_RAW, changed=True)
    report = _pipeline(exporter, [changed]).run()

    assert report.reused is False
    assert exporter.export_calls == 1


def test_rebuilds_when_nothing_changed_but_no_previous_output():
    exporter = _FakeExporter(existing=None)
    unchanged = replace(_RAW, changed=False)
    report = _pipeline(exporter, [unchanged]).run()

    assert report.reused is False
    assert exporter.export_calls == 1
