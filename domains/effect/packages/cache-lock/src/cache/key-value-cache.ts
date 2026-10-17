import { Context, type Effect } from "effect";
import type { CacheMissError } from "./cache-miss-error.ts";
import type { CacheTransportError } from "./cache-transport-error.ts";

/**
 * A string-to-string cache with a time to live per entry. Callers serialize
 * their own payloads (see `readCachedValue`), so the contract carries no
 * application types.
 *
 * It is explicit, never best-effort: a `get` that finds nothing fails with
 * `CacheMissError` and any backend failure with `CacheTransportError`. An
 * implementation never logs and swallows; what a miss or an outage means is
 * the caller's decision, because a cache in front of a database and a cache
 * that is the only store of a one-time token want opposite answers.
 */
export class KeyValueCache extends Context.Service<
	KeyValueCache,
	{
		readonly get: (
			key: string,
		) => Effect.Effect<string, CacheMissError | CacheTransportError>;
		readonly set: (
			key: string,
			value: string,
			ttlSeconds: number,
		) => Effect.Effect<void, CacheTransportError>;
		/**
		 * Adds one to the counter at `key` and returns the new total, creating it
		 * at 1 with `ttlSeconds` to live when absent. Atomic, so concurrent
		 * callers each see a distinct total; later increments keep the first
		 * expiry, so a busy window still resets.
		 */
		readonly increment: (
			key: string,
			ttlSeconds: number,
		) => Effect.Effect<number, CacheTransportError>;
		/** Deleting an absent key succeeds. */
		readonly delete: (key: string) => Effect.Effect<void, CacheTransportError>;
	}
>()("@voila.dev/cache-lock/KeyValueCache") {}
