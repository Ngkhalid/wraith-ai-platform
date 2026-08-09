"""Local-only API configuration."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]


@dataclass(frozen=True, slots=True)
class Settings:
    environment: str = "local-demo"
    data_dir: Path = Path(os.environ.get("NABILO_DATA_DIR", PROJECT_ROOT / "data" / "seed")).resolve()
    manifest_path: Path = Path(
        os.environ.get("NABILO_MANIFEST_PATH", PROJECT_ROOT / "data" / "manifest.json")
    ).resolve()
    database_path: Path = Path(
        os.environ.get(
            "NABILO_SQLITE_PATH",
            PROJECT_ROOT / "services" / "api" / ".runtime" / "nabilo-api.db",
        )
    ).resolve()
    local_origin_regex: str = r"^https?://(localhost|127\.0\.0\.1)(:\d{2,5})?$"


settings = Settings()

