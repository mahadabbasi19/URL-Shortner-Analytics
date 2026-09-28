# System Design — URL Shortener & Analytics Platform

Written as if presenting this in a backend/system-design interview: what the system needs to do, why each major component was chosen, what it actually implements today, and how it would evolve under real scale.

## 1. Functional Requirements

- Shorten a long URL into a short, collision-free code.
- Support custom aliases, with reserved-word protection.
- Redirect a short code to its original URL.
- Record a click event on every successful redirect (referrer, device/browser, approximate geography).
- Let a user register, log in, and manage their own URLs (create, list, view, edit, disable, delete).
- Expose aggregated analytics per URL (totals, time series, top-N breakdowns).
- Generate a QR code for a short URL.
- Enforce that a user can only see and manage their own URLs and analytics.

## 2. Non-Functional Requirements

- **Low redirect latency.** This is the one request path end users feel directly and repeatedly; every other endpoint is secondary to it.
- **Availability under partial failure.** A Redis outage, a slow GeoIP lookup, or an analytics-processing error must degrade gracefully, not take down redirects.
- **Horizontal scalability.** No component should assume it's the only instance running — session state, rate limits, and caching all live in shared stores (Postgres, Redis), not process memory.
- **Data integrity over raw speed for writes.** A short code must never resolve to two different URLs; Postgres, not the application layer, is the final arbiter of that.
- **Privacy-conscious analytics.** Useful aggregate data without retaining data that isn't needed (raw IPs).
- **Security.** Standard web-app threats (SQL injection, XSS, credential stuffing, open redirects, abuse) are addressed as part of the design, not bolted on afterward.

## 3. Why Each Major Technology

**Why PostgreSQL as the system of record.** ACID transactions and real foreign-key/unique constraints are what make the collision-retry logic and the alias-uniqueness guarantee actually correct under concurrent writes — an application-level "check then insert" can't give that guarantee, no matter how careful the code is. A relational model also fits the domain well: users own URLs, URLs generate click events, and analytics are fundamentally GROUP BY queries over that relationship.

**Why Redis, and specifically cache-aside.** The redirect path is read-heavy and latency-sensitive; Redis turns the hottest lookup in the system (`short_code → destination`) into an O(1) in-memory GET instead of a B-tree index scan over the network to Postgres. Cache-aside (read-through on miss, write on population, TTL as the safety net) was chosen over write-through or read-through because writes to a URL are rare relative to reads, and because Postgres must remain correct and authoritative on its own — Redis being wiped, cold, or entirely down should degrade performance, never correctness. This project's Redis is also reused for two other jobs that need the same properties (fast, shared, ephemeral, not the source of truth): rate-limit counters and nothing else — deliberately not sessions, not the JWT itself, not anything that would make Redis load-bearing for correctness.

**Why Base62, and why the database enforces uniqueness, not the application.** Base62 (`0-9a-zA-Z`) gives a large namespace (62⁷ ≈ 3.5 trillion at the default 7-character length) in URL-safe characters with no encoding needed. Two requests could theoretically generate the same random code at the same instant; only a database-level unique constraint, checked atomically at INSERT time, closes that race — an app-level `SELECT ... WHERE short_code = ?` before insert is a classic TOCTOU bug waiting to happen under load.

**Why analytics processing is asynchronous.** Parsing a User-Agent string, doing a GeoIP lookup, and writing a `click_events` row are all work the visitor being redirected doesn't need to wait for. Scheduling that work as a `BackgroundTask` — which FastAPI/Starlette runs only after the response has already been sent — means a slow or even failing analytics enrichment step adds zero latency to the redirect and can never turn into a redirect failure.

**Why FastAPI `BackgroundTasks` and not Kafka/Celery, for now.** At this project's actual traffic (a portfolio/demo deployment, not a production SaaS with real load), an in-process background task gets the same "don't block the response" property as a full message queue, with none of the operational overhead of running and monitoring a broker and worker fleet. See §6 for the documented path to a real queue if volume ever justified it.

## 4. Database Indexing Strategy

Every index was added for a specific, real query the application actually issues — not defensively:

| Index | Query served |
|---|---|
| `urls.short_code` (unique) | The redirect lookup — the single hottest read in the system |
| `urls.custom_alias` (unique) | Atomic alias-uniqueness check at creation time |
| `(urls.user_id, urls.created_at)` | "My links, newest first" |
| `(click_events.url_id, click_events.clicked_at)` | Every analytics query: "this URL's clicks in this date range" |
| `click_events.referrer_domain` | The top-referrers `GROUP BY` |

`click_events` is deliberately *not* over-indexed: it's the highest-write table in the schema (one row per redirect), and every additional index is additional write cost on every single click. Only the two access patterns actually used (per-URL date-range scans, and the referrer-domain grouping) get one.

## 5. Failure Scenarios

| Failure | System behavior |
|---|---|
| Redis is unavailable | Every `CacheService` and `RateLimiter` call catches `RedisError` internally. Caching falls back to Postgres-only (slower, still correct). Rate limiting **fails open** — requests are allowed through rather than rejected, because an outage in the abuse-prevention layer must not become an outage of the product. |
| PostgreSQL is unavailable | `/health` reports it explicitly. Every write-path request fails loudly with a `500` (there's no meaningful fallback for the system of record being down) — this is an honest failure, not a silent one. |
| Analytics processing fails (bad GeoIP data, a transient DB error inside `record_click`) | Caught, logged via `logger.exception`, and swallowed. The click that triggered it has already redirected successfully; losing one analytics row is an acceptable trade for never crashing the background-task runner. |
| GeoIP lookup fails or no database is configured | `GeoService.lookup()` returns `(None, None, None)`. The click event is still recorded, just without geography — a partial analytics record beats no record. |
| Duplicate short code is generated | Caught as a Postgres unique-constraint violation inside a `SAVEPOINT`; the service retries with a new code, up to a configured maximum, before failing loudly (this is treated as an abnormal, logged event past the first retry — the namespace is large enough that repeated collisions likely mean something else is wrong). |
| Custom alias already exists | Rejected immediately with `409 Conflict` — never silently substituted with a different code, since the user asked for that specific alias on purpose. |
| A link expires / is disabled | The redirect path checks `is_active`/`expires_at` on every request, whether served from cache or Postgres, and returns `410 Gone`. An edit/disable through the API additionally invalidates the cache entry immediately rather than waiting out the TTL. |
| Traffic spikes | The stateless backend and shared Redis/Postgres mean horizontal scaling (more backend instances behind a load balancer) works without code changes; rate limiting caps abusive spikes from a single client without affecting others. |
| Rate limit is exceeded | `429 Too Many Requests` with a `Retry-After` header computed from the actual remaining TTL on the counter key. |

## 6. Scaling Strategy — What's Implemented vs. What Would Come Next

**What this project actually implements:** a stateless FastAPI backend (any number of instances could run behind a load balancer today with zero code changes — no in-process session or rate-limit state), a single Postgres instance as the system of record, a single Redis instance for cache-aside and rate limiting, and an in-process background task for analytics enrichment.

**How it would evolve under real scale**, strictly as a documented direction — none of this is built, and building it now would be solving problems this project doesn't have:

- **Load balancer** in front of multiple stateless API instances — trivial today, since nothing in the app holds instance-local state.
- **Redis Cluster** if a single Redis instance's memory or throughput became the bottleneck — cache-aside and the rate limiter's key scheme both shard cleanly by key.
- **PostgreSQL read replicas** for analytics queries specifically (they're read-heavy and can tolerate slight replication lag), keeping the primary focused on the write-heavy redirect/click-insert path.
- **Connection pooling** (PgBouncer or similar) once enough backend instances exist that each opening its own Postgres connection pool stops being negligible.
- **A real event queue** (Kafka, SQS, or Redis Streams) between the redirect service and analytics processing, replacing `BackgroundTasks`, once click volume is high enough that in-process background work starts competing with the API server's own request-handling capacity for CPU/memory.
- **Dedicated analytics workers** consuming that queue, decoupled from and scaled independently of the redirect-serving fleet.
- **Partitioned `click_events`** (e.g. by month) once the table's size starts affecting index maintenance cost or query planning.
- **CDN/edge redirect** for the highest-traffic short links — pushing the `short_code → destination` mapping to edge locations would cut redirect latency further, at the cost of a more complex invalidation story than a single Redis cache-aside layer.

## 7. Consistency Trade-offs

- **Redis cache staleness window.** An edit made outside the API surface that exists today (there isn't one for `original_url`, only `title`/`expires_at`/`is_active` via `PATCH`) would go stale in the cache until the 1-hour TTL expired. Every field the *actual* update endpoint can change is invalidated immediately, so this is a theoretical gap in the current design, not an active one.
- **`total_clicks` is a denormalized counter**, updated synchronously alongside the authoritative `click_events` table. It can never be more than one write apart from correct, and it exists purely to avoid a `COUNT(*)` on every dashboard render — the detailed, ground-truth numbers always come from `click_events` itself.
- **Unique-visitor counts are an approximation**, not an exact count — `visitor_hash` rotates daily by design (see README "Privacy Considerations"), so it deliberately undercounts a visitor who returns after their hash has rotated, in exchange for never retaining a durable, re-identifiable visitor ID.

## 8. Rate Limiting Algorithm

Fixed-window, backed by Redis `INCR`/`EXPIRE`. Chosen over a sliding-window-log or token-bucket for simplicity and low per-request cost (one `INCR`, one conditional `EXPIRE`) — the trade-off being that a burst can let up to roughly 2x the nominal limit through across a window boundary. For anti-abuse limits at this project's scale, that bound is an acceptable price for the much simpler implementation; see the README's "Rate Limiting" section for the full write-up and the specific per-endpoint scopes.
