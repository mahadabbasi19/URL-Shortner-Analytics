import logging

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.health import router as health_router
from app.api.v1.redirect import router as redirect_router
from app.api.v1.urls import router as urls_router
from app.core.config import get_settings
from app.core.exceptions import AppError, app_error_handler, unhandled_error_handler, validation_error_handler
from app.core.logging_config import configure_logging

configure_logging()
logger = logging.getLogger("app.main")
settings = get_settings()

app = FastAPI(
    title="URL Shortener & Analytics Platform",
    version="0.1.0",
    description="A Bitly-style URL shortener with click analytics.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, unhandled_error_handler)

app.include_router(health_router)
app.include_router(urls_router)
# redirect_router must be last: its "/{short_code}" catch-all would otherwise
# shadow more specific routes registered after it.
app.include_router(redirect_router)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Application starting up | environment=%s", settings.environment)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    logger.info("Application shutting down")
