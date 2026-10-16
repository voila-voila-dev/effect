import { Context, type Effect } from "effect";
import type { LockAcquisitionError } from "./lock-acquisition-error.ts";

/**
 * Mutual exclusion per key: `withLock` runs the effect while holding the key
 * and releases it when the effect ends, whether it succeeds, fails or is
 * interrupted. Keys are plain namespaced strings (`sequence:{name}`).
 *
 * A distributed implementation is lease-based: a holder that crashes stops
 * blocking others once its lease runs out, so a key is never wedged forever.
 * The price is that a guarded effect outliving its lease loses exclusivity, so
 * keep guarded sections short — a read-modify-write, not a slow export.
 */
export class LockManager extends Context.Service<
	LockManager,
	{
		readonly withLock: <A, E, R>(
			key: string,
			effect: Effect.Effect<A, E, R>,
		) => Effect.Effect<A, E | LockAcquisitionError, R>;
	}
>()("@voila.dev/cache-lock/LockManager") {}
