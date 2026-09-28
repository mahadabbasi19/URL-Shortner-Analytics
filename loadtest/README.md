# Load Testing

`locustfile.py` measures the redirect endpoint (`GET /{short_code}`) under two scenarios in the same run: cache-hit (a URL requested repeatedly, served from Redis after the first hit) and cache-miss (a brand-new URL requested exactly once, guaranteeing a Postgres round-trip).

## Running it

Rate limiting will interfere with a legitimate load test (it's designed to), so raise the limits before running:

```bash
# In .env, temporarily:
RATE_LIMIT_ANON_CREATE=100000/3600
RATE_LIMIT_REDIRECT=1000000/60
```

Then, with the stack running (`docker compose up -d`):

```bash
docker run --rm --network urlshortner_default \
  -v "$(pwd)/loadtest:/loadtest" \
  python:3.12-slim \
  bash -c "pip install --quiet locust && locust -f /loadtest/locustfile.py --host=http://backend:8000 --headless -u 20 -r 5 --run-time 30s --csv=/loadtest/results"
```

Or interactively: `locust -f loadtest/locustfile.py --host=http://localhost:8000`, then open `http://localhost:8089`.

**Revert the `.env` rate-limit overrides afterward** — they exist only to let the load test itself avoid tripping the anti-abuse limiter.

## Results (measured)

Run on 2026-09-28, on a single developer machine (Apple Silicon, via Colima), all services (backend, Postgres, Redis) and the load generator co-located on the same Docker bridge network — **not** representative of production infrastructure or network latency, but real, reproducible numbers from this exact codebase, not invented ones. 20 concurrent simulated users, 30 seconds, zero failures across 5,298 requests.

| Metric | Cache-hit | Cache-miss |
|---|---|---|
| Requests | 3,200 | 1,034 |
| Median (p50) | 2 ms | 3 ms |
| p90 | 4 ms | 5 ms |
| p95 | 5 ms | 6 ms |
| p99 | 8 ms | 8 ms |
| Max | 19 ms | 13 ms |
| Throughput | 110 req/s | 36 req/s |
| Error rate | 0% | 0% |

**Reading these numbers honestly:** the absolute gap between cache-hit and cache-miss is small here because Postgres, Redis, and the backend are all on the same machine with sub-millisecond network hops between them — the Postgres query itself is cheap (`short_code` is a unique-indexed lookup on a small table). The gap would widen substantially in a real deployment where Postgres and Redis are separate network hops apart, or under a much larger dataset where the Postgres index lookup itself gets costlier relative to Redis's O(1) `GET`. What these numbers *do* confirm: the cache-aside path works correctly under concurrent load (zero errors, zero stale reads), and cache-hit is consistently faster at every percentile measured, even in this best-case, everything-local topology.

Full raw output is in `results_stats.csv` (git-ignored — regenerate rather than trust a stale copy).
