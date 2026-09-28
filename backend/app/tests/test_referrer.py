from app.utils.referrer import DIRECT, normalize_referrer


def test_normalize_referrer_none_returns_direct():
    raw, domain = normalize_referrer(None)
    assert raw is None
    assert domain == DIRECT


def test_normalize_referrer_empty_string_returns_direct():
    _, domain = normalize_referrer("")
    assert domain == DIRECT


def test_normalize_referrer_google_variants_map_to_canonical():
    for url in ["https://www.google.com/search?q=x", "https://google.co.uk/search"]:
        _, domain = normalize_referrer(url)
        assert domain == "google.com"


def test_normalize_referrer_facebook_subdomain_maps_to_canonical():
    _, domain = normalize_referrer("https://l.facebook.com/l.php?u=https://example.com")
    assert domain == "facebook.com"


def test_normalize_referrer_unknown_domain_passes_through():
    raw, domain = normalize_referrer("https://some-random-blog.example.org/post")
    assert raw == "https://some-random-blog.example.org/post"
    assert domain == "some-random-blog.example.org"


def test_normalize_referrer_strips_www():
    _, domain = normalize_referrer("https://www.example.com/")
    assert domain == "example.com"
