---
"@voila.dev/cache-lock": minor
---

The root entry no longer imports `effect/persistence`, so it bundles with Metro in a React Native app. `inMemoryRateLimiterLayer` and `rateLimiterFromStoreLayer` move to the new `@voila.dev/cache-lock/store` entry.
