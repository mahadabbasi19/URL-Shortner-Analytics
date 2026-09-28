import hashlib
from datetime import date


def hash_visitor(ip: str | None, user_agent: str | None, day: date | None = None) -> str | None:
    """SHA-256 of (IP + User-Agent + day) — never the raw IP. Used only to
    approximate unique-visitor counts (COUNT DISTINCT visitor_hash), never
    to identify a specific person. Rotating the salt daily bounds how long
    the same hash can be correlated: the same visitor gets a different hash
    tomorrow, by design.
    """
    if not ip:
        return None
    day = day or date.today()
    raw = f"{ip}|{user_agent or ''}|{day.isoformat()}"
    return hashlib.sha256(raw.encode()).hexdigest()
