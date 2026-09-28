import re
from urllib.parse import urlparse

DIRECT = "Direct/Unknown"

# Referrers land on many subdomains for the same real source (l.facebook.com,
# m.facebook.com, lite.duckduckgo.com, ...). This maps the common ones onto a
# single canonical name so "top referrers" is actually readable instead of
# fragmenting one traffic source across ten rows.
_KNOWN_DOMAIN_SUFFIXES: dict[str, str] = {
    "google": "google.com",
    "facebook": "facebook.com",
    "fb": "facebook.com",
    "instagram": "instagram.com",
    "linkedin": "linkedin.com",
    "twitter": "x.com",
    "x": "x.com",
    "t.co": "x.com",
    "reddit": "reddit.com",
    "youtube": "youtube.com",
    "bing": "bing.com",
    "duckduckgo": "duckduckgo.com",
    "yahoo": "yahoo.com",
    "github": "github.com",
}


def normalize_referrer(referrer: str | None) -> tuple[str | None, str]:
    """Returns (raw_referrer_url_or_None, normalized_domain). Normalized
    domain is always a usable string — "Direct/Unknown" when there's no
    referrer at all, so aggregation queries never have to special-case NULL.
    """
    if not referrer:
        return None, DIRECT

    try:
        host = urlparse(referrer).netloc.lower()
    except ValueError:
        return referrer, DIRECT

    host = re.sub(r"^www\.", "", host)
    host = host.split(":")[0]  # drop a port, if any
    if not host:
        return referrer, DIRECT

    parts = host.split(".")
    for label in parts[:-1] or parts:
        canonical = _KNOWN_DOMAIN_SUFFIXES.get(label)
        if canonical:
            return referrer, canonical

    return referrer, host
