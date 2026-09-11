from app.core.domain.pipelines.schema import model_to_specs
from app.core.domain.pipelines.spec_transformer import SpecTransformer
from app.modules.trajetoria.domain.categories import CATEGORY_LABELS
from app.modules.trajetoria.domain.column_aliases import ALIASES
from app.modules.trajetoria.domain.schema import TrajetoriaRow

_REQUIRED_COLUMNS = ("codigo_ies",)


class TrajetoriaTransformer(SpecTransformer):
    """Transform do módulo Trajetória: specs de ``TrajetoriaRow`` + aliases."""

    def __init__(self) -> None:
        super().__init__(
            model_to_specs(TrajetoriaRow, ALIASES),
            CATEGORY_LABELS,
            required_columns=_REQUIRED_COLUMNS,
        )
