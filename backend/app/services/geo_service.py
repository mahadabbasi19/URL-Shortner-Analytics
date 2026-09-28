import logging
from functools import lru_cache
from pathlib import Path

import geoip2.database
from geoip2.errors import AddressNotFoundError

from app.core.config import Settings, get_settings

logger = logging.getLogger("app.geo")


class GeoService:
    """Approximate IP -> country/region/city lookup using a local MaxMind
    GeoLite2 database (free tier, requires a MaxMind account to download —
    see README "Geolocation").

    Geolocation is inherently approximate: VPNs, proxies, mobile carrier
    NAT, and corporate gateways all route traffic through IPs that don't
    reflect the visitor's real location. This is a known, documented
    limitation, not a bug.

    If no database file is present, every lookup returns (None, None, None)
    instead of raising — geolocation is an analytics enrichment, and its
    absence must never block a redirect or crash a background task.
    """

    def __init__(self, settings: Settings):
        self._reader: geoip2.database.Reader | None = None
        path = Path(settings.geoip_database_path)
        if not path.exists():
            logger.info(
                "GeoIP database not found at %s — geolocation disabled until configured", path
            )
            return
        try:
            self._reader = geoip2.database.Reader(str(path))
        except Exception:
            logger.warning("Failed to open GeoIP database at %s", path, exc_info=True)

    def lookup(self, ip: str | None) -> tuple[str | None, str | None, str | None]:
        if not ip or self._reader is None:
            return None, None, None
        try:
            response = self._reader.city(ip)
        except (AddressNotFoundError, ValueError):
            return None, None, None
        except Exception:
            logger.warning("GeoIP lookup failed for an IP", exc_info=True)
            return None, None, None

        region = response.subdivisions.most_specific.name if response.subdivisions else None
        return response.country.name, region, response.city.name


@lru_cache
def get_geo_service() -> GeoService:
    """Cached so the (potentially large) GeoLite2 database file is memory-
    mapped once per process, not re-opened on every click.
    """
    return GeoService(get_settings())
