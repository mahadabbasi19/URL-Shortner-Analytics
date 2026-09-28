"""Load test for the redirect endpoint (GET /{short_code}), comparing
Redis cache-hit vs. cache-miss latency — the two scenarios called out in
the README's Performance Results section.

Run:
    pip install locust
    locust -f loadtest/locustfile.py --host=http://localhost:8000

Then open http://localhost:8089, pick a user count/spawn rate, and start.
To isolate one scenario, run with --class-picker or comment out the class
you don't want, since by default Locust mixes both user classes together.

CacheHitUser:  creates ONE url on start, then repeatedly GETs that same
               short_code — after the first request, every subsequent hit
               should be served from Redis.
CacheMissUser: creates a brand-new url before every single request, then
               GETs it exactly once — since the short_code has never been
               requested before, this is a guaranteed cache miss (forces
               the Postgres SELECT + Redis SETEX path) on every iteration.
"""

import uuid

from locust import HttpUser, between, task


class CacheHitUser(HttpUser):
    wait_time = between(0.05, 0.2)
    weight = 3  # cache hits should dominate real traffic; weight the mix accordingly

    def on_start(self):
        resp = self.client.post(
            "/api/v1/urls",
            json={"original_url": f"https://example.com/loadtest/{uuid.uuid4()}"},
            name="POST /api/v1/urls (setup)",
        )
        self.short_code = resp.json()["short_code"]
        # Warm the cache once, outside the measured task.
        self.client.get(f"/{self.short_code}", name="GET /{short_code} (warmup)", allow_redirects=False)

    @task
    def redirect_cache_hit(self):
        self.client.get(f"/{self.short_code}", name="GET /{short_code} [cache-hit]", allow_redirects=False)


class CacheMissUser(HttpUser):
    wait_time = between(0.05, 0.2)
    weight = 1

    @task
    def redirect_cache_miss(self):
        resp = self.client.post(
            "/api/v1/urls",
            json={"original_url": f"https://example.com/loadtest/{uuid.uuid4()}"},
            name="POST /api/v1/urls (setup)",
        )
        short_code = resp.json()["short_code"]
        self.client.get(f"/{short_code}", name="GET /{short_code} [cache-miss]", allow_redirects=False)
