RESERVED_ALIASES: frozenset[str] = frozenset(
    {
        "api",
        "docs",
        "redoc",
        "openapi.json",
        "admin",
        "login",
        "register",
        "logout",
        "health",
        "static",
        "favicon.ico",
        "app",
        "dashboard",
        "settings",
        "www",
        "assets",
    }
)


def is_reserved(alias: str) -> bool:
    return alias.lower() in RESERVED_ALIASES
