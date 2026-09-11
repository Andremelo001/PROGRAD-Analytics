from app.core.domain.pipelines.schema import model_to_specs
from app.core.domain.pipelines.spec_transformer import SpecTransformer
from app.modules.qualidade.domain.categories import CATEGORY_LABELS
from app.modules.qualidade.domain.column_aliases import ALIASES
from app.modules.qualidade.domain.schema import CpcRow

_REQUIRED_COLUMNS = ("codigo_ies",)


class CpcTransformer(SpecTransformer):
    """Transform do módulo Qualidade: specs derivados de ``CpcRow`` + aliases."""

    def __init__(self) -> None:
        super().__init__(
            model_to_specs(CpcRow, ALIASES),
            CATEGORY_LABELS,
            required_columns=_REQUIRED_COLUMNS,
        )
