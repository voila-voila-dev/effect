import { Clock, Effect, Layer } from "effect";
import { CacheMissError } from "./cache-miss-error.ts";
import { KeyValueCache } from "./key-value-cache.ts";

interface Entry {
	readonly value: string;
	readonly expiresAtMillis: number;
}

/**
 * A per-process `KeyValueCache` with the same TTL semantics as the Redis one,
 * for development and tests. Expiry reads the Effect `Clock`, so a test moves
 * time with `TestClock` instead of sleeping. There is no transport, so it
 * never fails with `CacheTransportError`. Each build of the layer gets its own
 * map.
 */
export const inMemoryKeyValueCacheLayer: Layer.Layer<KeyValueCache> =
	Layer.sync(KeyValueCache, () => {
		const store = new Map<string, Entry>();

		const live = (key: string, now: number) => {
			const entry = store.get(key);
			if (entry === undefined || entry.expiresAtMillis > now) {
				return entry;
			}
			// Evicted on read so a long-lived process does not keep dead entries.
			store.delete(key);
			return undefined;
		};

		return KeyValueCache.of({
			get: (key) =>
				Effect.flatMap(Clock.currentTimeMillis, (now) => {
					const entry = live(key, now);
					return entry === undefined
						? Effect.fail(new CacheMissError({ key }))
						: Effect.succeed(entry.value);
				}),

			set: (key, value, ttlSeconds) =>
				Effect.map(Clock.currentTimeMillis, (now) => {
					store.set(key, { value, expiresAtMillis: now + ttlSeconds * 1000 });
				}),

			// A synchronous read-modify-write on one thread is as atomic as INCR.
			increment: (key, ttlSeconds) =>
				Effect.map(Clock.currentTimeMillis, (now) => {
					const entry = live(key, now);
					const total = entry === undefined ? 1 : Number(entry.value) + 1;
					store.set(key, {
						value: String(total),
						expiresAtMillis: entry?.expiresAtMillis ?? now + ttlSeconds * 1000,
					});
					return total;
				}),

			delete: (key) =>
				Effect.sync(() => {
					store.delete(key);
				}),
		});
	});
