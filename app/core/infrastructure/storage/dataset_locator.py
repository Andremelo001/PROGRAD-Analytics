from pathlib import Path


def find_dataset(base_dir: Path, name: str) -> Path:
    """Localiza ``<name>.csv`` ou ``<name>.csv.gz`` em ``base_dir``."""
    for suffix in (".csv.gz", ".csv"):
        candidate = base_dir / f"{name}{suffix}"
        if candidate.exists():
            return candidate
    msg = (
        f"dataset '{name}' não encontrado em {base_dir} — "
        "rode o pipeline desse módulo antes"
    )
    raise FileNotFoundError(msg)
