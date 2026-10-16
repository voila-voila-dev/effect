# @voila.dev/cache-lock

Once a backend runs on more than one instance, three things stop working in
memory: a cache shared between them, a lock that two instances respect, and a
rate limit that counts every instance's calls. This package gives each one as
an Effect service, with an in-memory implementation for development and tests
and a Redis one for production — the code that uses them does not change.

- **Explicit failures, caller's policy.** A cache miss, a backend outage and a
  store that cannot count are typed errors. Whether an outage falls back,
  lets the call through or refuses it is decided where the call is made.
- **Lease-based locks.** A crashed holder blocks its key for one lease at
  most, and a holder never releases a lock someone else took over.
- **No Redis in the root entry.** The Redis implementations live in
  `@voila.dev/cache-lock/redis` and run on Effect's `Redis` service, so you
  bring the client (Bun's built-in one, or any other). The root entry does not
  import `effect/persistence` either, so the contracts bundle in a React Native
  app; the limiters built on it live in `@voila.dev/cache-lock/store`.

```sh
bun add @voila.dev/cache-lock effect
```

## Cache

```ts
import { KeyValueCache, readCachedValue, writeCachedValue } from "@voila.dev/cache-lock";
import { Effect, Option } from "effect";

const profile = (id: string) =>
	Effect.gen(function* () {
		const cache = yield* KeyValueCache;
		const cached = yield* readCachedValue(cache, `profile:${id}`, Profile);
		if (Option.isSome(cached)) return cached.value;
		const fresh = yield* loadProfile(id);
		yield* writeCachedValue(cache, { key: `profile:${id}`, schema: Profile, value: fresh, ttlSeconds: 300 });
		return fresh;
	});
```

`readCachedValue` and `writeCachedValue` are for a cache in front of a source
of truth: they never fail. When the cache is the only store (a one-time code),
use `cache.get` and handle `CacheMissError` and `CacheTransportError` yourself.
`cache.increment(key, ttlSeconds)` is an atomic counter for a fixed window.

## Lock

```ts
import { LockManager } from "@voila.dev/cache-lock";

const next = Effect.gen(function* () {
	const locks = yield* LockManager;
	return yield* locks.withLock("sequence:orders", takeNextNumber);
});
```

The lock is released when the effect ends, however it ends. On Redis,
`withLock` fails with `LockAcquisitionError` when the key is still held after
the acquisition timeout; the guarded effect then never ran. Keep guarded
sections shorter than the lease (30 seconds by default).

## Rate limit

```ts
import { allowWhenUnavailable, denyWhenUnavailable, RateLimiter } from "@voila.dev/cache-lock";

const limiter = yield* RateLimiter;

// A throttle: an outage of the store must not lock everyone out.
yield* allowWhenUnavailable(limiter.consume({ key: `signup:${ip}`, limit: 5, windowSeconds: 3600 }));

// A security control: an outage must not lift it.
yield* denyWhenUnavailable(limiter.consume({ key: `login:${email}`, limit: 5, windowSeconds: 900 }));
```

Both leave `RateLimitedError` (with `retryAfterSeconds`) as the only failure.
Counting is Effect's own `RateLimiter`; `rateLimiterFromStoreLayer` (from
`@voila.dev/cache-lock/store`) plugs this service onto any `RateLimiterStore`.

## Layers

```ts
import { inMemoryKeyValueCacheLayer, inMemoryLockManagerLayer } from "@voila.dev/cache-lock";
import { inMemoryRateLimiterLayer } from "@voila.dev/cache-lock/store";
import { redisKeyValueCacheLayer, redisLockManagerLayer, redisRateLimiterLayer } from "@voila.dev/cache-lock/redis";
import { BunRedis } from "@effect/platform-bun";
import { Layer } from "effect";

const Development = Layer.mergeAll(inMemoryKeyValueCacheLayer, inMemoryLockManagerLayer, inMemoryRateLimiterLayer);

const Production = Layer.mergeAll(
	redisKeyValueCacheLayer({ prefix: "app:cache:" }),
	redisLockManagerLayer({ prefix: "app:lock:", lease: "30 seconds", acquireTimeout: "10 seconds" }),
	redisRateLimiterLayer({ prefix: "app:rate-limit:" }),
).pipe(Layer.provide(BunRedis.layer({ url: process.env.REDIS_URL })));
```

The Redis layers need a `Redis` service from `effect/persistence`; providing
one client to all three keeps them on one connection. A prefix per environment
lets several share a server. The in-memory lock has no acquisition timeout: a
holder waits its turn.

`makeRedisKeyValueCache(redis, options)` and `makeRedisLockManager(redis,
options)` build the services directly, for tests over a stub `Redis`.

## Tests

The Redis tests run against a stub. Set `REDIS_URL` to also run them against a
real server; without it they are skipped.
