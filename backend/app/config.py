from functools import lru_cache
import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# Load a local .env file when running outside Docker. Docker Compose passes these
# values as real environment variables, so this is only a developer convenience.
load_dotenv()
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class Settings:
    """Application settings sourced from environment variables."""

    def __init__(self) -> None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise RuntimeError(
                "DATABASE_URL is required. Set it in .env, Docker Compose, or your hosting platform."
            )

        self.database_url = database_url
        self.cors_origins = self._parse_csv(os.getenv("CORS_ORIGINS", "")) or [
            "http://localhost:8080",
            "http://localhost:5173",
        ]
        self.app_name = os.getenv("APP_NAME", "Inventory & Order Management API")
        self.environment = os.getenv("ENVIRONMENT", "development")

    @staticmethod
    def _parse_csv(value: str) -> List[str]:
        return [item.strip() for item in value.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
