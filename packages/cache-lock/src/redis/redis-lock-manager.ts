import { Clock, Duration, Effect, Layer } from "effect";
import { Redis } from "effect/persistence";
import { LockAcquisitionError } from "../lock/lock-acquisition-error.ts";
import { LockManager } from "../lock/lock-manager.ts";

export interface RedisLockManagerOptions {
	/** Put in front of every key. Defaults to `"lock:"`. */
	readonly prefix?: string;
	/** How long a crashed holder can block the key. Defaults to 30 seconds. */
	readonly lease?: Duration.Input;
	/** How long `withLock` waits for a held key before failing. Defaults to 10 seconds. */
	readonly acquireTimeout?: Duration.Input;
	/** The pause between two attempts on a held key. Defaults to 100 milliseconds. */
	readonly retryDelay?: Duration.Input;
}

// A holder whose lease already ran out must not delete the lock the next
// holder now owns, so release compares the token before deleting.
const releaseScript = Redis.script(
	(key: string, token: string) => [key, token],
	{
		numberOfKeys: 1,
		lua: `if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end`,
	},
).withReturnType<number>();

/**
 * The single-instance Redis lock: `SET key token NX PX lease` to acquire,
 * polled until the acquisition timeout, and a compare-and-delete script to
 * release. The layer is the usual entry.
 */
export function makeRedisLockManager(
	redis: Redis.Redis["Service"],
	options: RedisLockManagerOptions = {},
): LockManager["Service"] {
	const prefix = options.prefix ?? "lock:";
	const leaseMillis = String(Duration.toMillis(options.lease ?? "30 seconds"));
	const acquireTimeoutMillis = Duration.toMillis(
		options.acquireTimeout ?? "10 seconds",
	);
	const retryDelay = options.retryDelay ?? "100 millis";
	const release = redis.eval(releaseScript);

	const acquire = (key: string, storageKey: string, token: string) =>
		Effect.gen(function* () {
			const startMillis = yield* Clock.currentTimeMillis;
			while (true) {
				const reply = yield* redis
					.send<string | null>(
						"SET",
						storageKey,
						token,
						"NX",
						"PX",
						leaseMillis,
					)
					.pipe(
						Effect.mapError(
							(error) =>
								new LockAcquisitionError({
									key,
									reason: `acquire failed: ${error.cause}`,
								}),
						),
					);
				if (reply === "OK") {
					return;
				}
				if (
					(yield* Clock.currentTimeMillis) - startMillis >=
					acquireTimeoutMillis
				) {
					return yield* new LockAcquisitionError({
						key,
						reason: `still held after ${acquireTimeoutMillis}ms`,
					});
				}
				yield* Effect.sleep(retryDelay);
			}
		});

	return LockManager.of({
		withLock: (key, effect) =>
			Effect.suspend(() => {
				const storageKey = `${prefix}${key}`;
				const token = crypto.randomUUID();
				// Masked so an interruption landing between a successful acquire
				// and the guarded effect still releases; the waiting itself stays
				// interruptible. A release that fails is ignored: the lease frees
				// the key on its own.
				return Effect.uninterruptibleMask((restore) =>
					restore(acquire(key, storageKey, token)).pipe(
						Effect.andThen(
							restore(effect).pipe(
								Effect.ensuring(Effect.ignore(release(storageKey, token))),
							),
						),
					),
				);
			}),
	});
}

/** `LockManager` on the `Redis` service the application provides. */
export const redisLockManagerLayer = (
	options: RedisLockManagerOptions = {},
): Layer.Layer<LockManager, never, Redis.Redis> =>
	Layer.effect(
		LockManager,
		Redis.Redis.useSync((redis) => makeRedisLockManager(redis, options)),
	);
