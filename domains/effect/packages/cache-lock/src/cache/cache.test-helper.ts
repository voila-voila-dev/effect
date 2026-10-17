import { Effect } from "effect";
import { CacheTransportError } from "./cache-transport-error.ts";
import { inMemoryKeyValueCacheLayer } from "./in-memory-key-value-cache.ts";
import { KeyValueCache } from "./key-value-cache.ts";

/** A fresh in-memory cache, built outside of any layer for direct use. */
export const makeCache = (): KeyValueCache["Service"] =>
	Effect.runSync(
		KeyValueCache.useSync((cache) => cache).pipe(
			Effect.provide(inMemoryKeyValueCacheLayer),
		),
	);

/** A cache whose backend is down: every call fails with a transport error. */
export const unreachableCache: KeyValueCache["Service"] = KeyValueCache.of({
	get: (key) => Effect.fail(new CacheTransportError({ key, reason: "down" })),
	set: (key) => Effect.fail(new CacheTransportError({ key, reason: "down" })),
	increment: (key) =>
		Effect.fail(new CacheTransportError({ key, reason: "down" })),
	delete: (key) =>
		Effect.fail(new CacheTransportError({ key, reason: "down" })),
});
