from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application configuration, loaded from environment variables.

    WHY a single Settings object: every service/module imports get_settings()
    instead of reading os.environ directly, so config is typed, validated
    once at startup, and easy to override in tests.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Postgres
    database_url: str = "postgresql+psycopg://shortener:change_me_in_dev@localhost:5432/url_shortener"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Auth
    jwt_secret: str = "insecure-dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # App
    base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:5173"
    environment: str = "development"
    log_level: str = "INFO"

    # Short code
    short_code_length: int = 7
    short_code_max_retries: int = 5

    # Rate limiting — "count/window_seconds"
    rate_limit_anon_create: str = "10/3600"
    rate_limit_auth_create: str = "100/3600"
    rate_limit_auth_login: str = "10/300"
    rate_limit_redirect: str = "300/60"
    rate_limit_analytics: str = "120/60"

    # Geolocation
    geoip_database_path: str = "./data/GeoLite2-City.mmdb"

    # Cache
    redirect_cache_ttl_seconds: int = 3600

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
