import sys

from loguru import logger

from app.core.config.settings import settings


def configure_logging() -> None:
    is_prod = settings.env.lower() in ("production", "prod")
    fmt = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> "
        "<level>{level: <8}</level> "
        "<cyan>{name}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>\n"
        if not is_prod
        else "{time:YYYY-MM-DD HH:mm:ss} {level} {name}:{line} {message}\n"
    )
    logger.remove()
    logger.add(sys.stdout, level=settings.log_level, format=fmt, colorize=not is_prod)
