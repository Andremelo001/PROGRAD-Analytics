from datetime import UTC, datetime
from pathlib import Path

from loguru import logger

from app.core.infrastructure.storage.json_exporter import JsonExporter
from app.modules.dashboard.application.ports.dashboard_source import DashboardSource
from app.modules.dashboard.domain import shared
from app.modules.dashboard.domain.section import DashboardContext, DashboardSection
from app.modules.dashboard.domain.services import (
    campus_overview,
    course_comparison,
    course_profile,
    national_benchmarks,
    trajectory_comparison,
)
from app.modules.dashboard.infrastructure.sources.processed_csv_source import (
    ProcessedCsvSource,
)

_NAME = "dashboard"

# Ordem = ordem das seções no dashboard.json. Acrescentar uma seção nova
# é registrar mais uma linha aqui — não editar build_dashboard().
_SECTIONS: tuple[DashboardSection, ...] = (
    course_profile.CourseProfileSection(),
    course_comparison.CourseComparisonSection(),
    trajectory_comparison.TrajectoryComparisonSection(),
    campus_overview.CampusOverviewSection(),
    national_benchmarks.NationalBenchmarksSection(),
)


def build_dashboard(*, source: DashboardSource | None = None) -> Path:
    """Lê qualidade.csv + trajetoria.csv[.gz] e grava o dashboard.json.

    Recorta os dois datasets para o escopo configurado e grava o resultado em
    ``app/data/processed/dashboard.json``.
    """
    source = source if source is not None else ProcessedCsvSource()
    qualidade_nacional = source.read_qualidade()
    trajetoria_nacional = source.read_trajetoria()

    data = shared.build_scoped_data(qualidade_nacional, trajetoria_nacional)
    if data.cursos.empty:
        logger.warning(
            "dashboard | nenhum curso encontrado no escopo configurado "
            "(ver DASHBOARD_CODIGO_IES/DASHBOARD_CODIGO_MUNICIPIO no .env)"
        )

    context = DashboardContext(
        data=data,
        qualidade_nacional=qualidade_nacional,
        trajetoria_nacional=trajetoria_nacional,
    )

    payload: dict[str, object] = {
        "gerado_em": datetime.now(UTC).isoformat(timespec="seconds"),
        "escopo": shared.build_escopo(data.qualidade, data.trajetoria),
        "cursos": shared.records(data.cursos),
    }
    for section in _SECTIONS:
        payload[section.key] = section.build(context)

    path = JsonExporter().export(payload, _NAME)
    logger.info("dashboard | cursos={} -> {}", len(data.cursos), path)
    return path
