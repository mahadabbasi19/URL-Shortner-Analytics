from datetime import date

from app.utils.visitor_hash import hash_visitor


def test_hash_visitor_none_ip_returns_none():
    assert hash_visitor(None, "some-ua") is None


def test_hash_visitor_is_deterministic_for_same_day():
    d = date(2026, 1, 1)
    h1 = hash_visitor("1.2.3.4", "ua-string", day=d)
    h2 = hash_visitor("1.2.3.4", "ua-string", day=d)
    assert h1 == h2
    assert len(h1) == 64


def test_hash_visitor_differs_across_days():
    h1 = hash_visitor("1.2.3.4", "ua", day=date(2026, 1, 1))
    h2 = hash_visitor("1.2.3.4", "ua", day=date(2026, 1, 2))
    assert h1 != h2


def test_hash_visitor_differs_by_ip():
    d = date(2026, 1, 1)
    h1 = hash_visitor("1.2.3.4", "ua", day=d)
    h2 = hash_visitor("5.6.7.8", "ua", day=d)
    assert h1 != h2
