from dataclasses import dataclass
from typing import Protocol

import pandas as pd

from app.core.domain.pipelines.report import FileReport
from app.core.domain.value_objects.raw_file import RawFile


@dataclass(frozen=True, slots=True)
class TransformResult:
    frame: pd.DataFrame
    report: FileReport


class Transformer(Protocol):
    """Renomeia colunas, converte tipos, decodifica categorias e trata nulos."""

    def transform(self, frame: pd.DataFrame, raw: RawFile) -> TransformResult: ...
