from collections.abc import Mapping, Sequence

from app.core.domain.pipelines.spec_transformer import SpecTransformer
from app.core.domain.value_objects.column_spec import ColumnSpec

_REQUIRED_COLUMNS = ("codigo_ies",)


class CpcTransformer(SpecTransformer):
    """Transform do módulo Qualidade.

    ``specs``/``category_labels`` vêm de ``CpcRow`` + ``colunas_inep.json``
    (montados no use case); aqui só fixa a coluna-chave obrigatória.
    """

    def __init__(
        self,
        specs: Sequence[ColumnSpec],
        category_labels: Mapping[str, Mapping[int, str]],
    ) -> None:
        super().__init__(specs, category_labels, required_columns=_REQUIRED_COLUMNS)
