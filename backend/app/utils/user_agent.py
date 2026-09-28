from user_agents import parse as parse_ua_string


def parse_user_agent(ua_string: str | None) -> tuple[str | None, str | None, str | None]:
    """Returns (browser, operating_system, device_type). Uses the
    `user-agents` library rather than a hand-rolled parser — UA strings are
    a notoriously messy, ever-changing format not worth reinventing.
    """
    if not ua_string:
        return None, None, None

    ua = parse_ua_string(ua_string)

    if ua.is_bot:
        device_type = "Bot"
    elif ua.is_mobile:
        device_type = "Mobile"
    elif ua.is_tablet:
        device_type = "Tablet"
    elif ua.is_pc:
        device_type = "Desktop"
    else:
        device_type = "Other"

    browser = ua.browser.family or None
    operating_system = ua.os.family or None
    return browser, operating_system, device_type
