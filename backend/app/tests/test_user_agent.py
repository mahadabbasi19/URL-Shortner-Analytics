from app.utils.user_agent import parse_user_agent


def test_parse_user_agent_none_returns_all_none():
    assert parse_user_agent(None) == (None, None, None)


def test_parse_desktop_chrome():
    ua = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    browser, os_name, device = parse_user_agent(ua)
    assert browser == "Chrome"
    assert os_name == "Windows"
    assert device == "Desktop"


def test_parse_mobile_safari():
    ua = (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    )
    browser, os_name, device = parse_user_agent(ua)
    assert browser == "Mobile Safari"
    assert os_name == "iOS"
    assert device == "Mobile"


def test_parse_bot_is_categorized_as_bot():
    ua = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    _, _, device = parse_user_agent(ua)
    assert device == "Bot"
