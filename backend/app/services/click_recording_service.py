import logging
import uuid

from app.core.database import SessionLocal
from app.models.click_event import ClickEvent
from app.services.geo_service import get_geo_service
from app.utils.referrer import normalize_referrer
from app.utils.user_agent import parse_user_agent
from app.utils.visitor_hash import hash_visitor

logger = logging.getLogger("app.analytics.recorder")


def record_click(url_id: uuid.UUID, ip: str | None, user_agent: str | None, referrer: str | None) -> None:
    """Runs as a FastAPI BackgroundTask — scheduled by the redirect endpoint
    but executed only after the redirect response has already been sent to
    the client. A slow GeoIP lookup or a transient DB issue here adds zero
    latency to the redirect itself.

    Takes plain strings, not the Request object: BackgroundTasks capture
    arguments at schedule time, and holding a reference to the live Request
    into a task that runs after the response is sent is the kind of thing
    that works until it doesn't. Opens its own session because the
    request-scoped one (from `get_db`) is already closed by the time this
    runs.

    Failures here are logged and swallowed, never raised — analytics must
    never crash the process or affect any other request.
    """
    db = SessionLocal()
    try:
        country, region, city = get_geo_service().lookup(ip)
        browser, operating_system, device_type = parse_user_agent(user_agent)
        referrer_raw, referrer_domain = normalize_referrer(referrer)

        event = ClickEvent(
            url_id=url_id,
            visitor_hash=hash_visitor(ip, user_agent),
            country=country,
            region=region,
            city=city,
            referrer=referrer_raw,
            referrer_domain=referrer_domain,
            user_agent=user_agent,
            browser=browser,
            operating_system=operating_system,
            device_type=device_type,
        )
        db.add(event)
        db.commit()
    except Exception:
        logger.exception("Failed to record click analytics for url_id=%s", url_id)
        db.rollback()
    finally:
        db.close()
