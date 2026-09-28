def parse_rate(spec: str) -> tuple[int, int]:
    """Parses a "count/window_seconds" string (e.g. "10/3600") from
    Settings into (limit, window_seconds).
    """
    count_str, window_str = spec.split("/")
    return int(count_str), int(window_str)
