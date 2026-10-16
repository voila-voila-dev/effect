import { Effect, Schema } from "effect";
import type { KeyValueCache } from "./key-value-cache.ts";

/**
 * Writes an entry through its schema's JSON encoding, the counterpart of
 * `readCachedValue`. It never fails: the value was already read from the
 * source of truth, so a value that does not encode is simply not cached and a
 * transport failure is logged and skipped.
 */
export const writeCachedValue = <A, I>(
	cache: KeyValueCache["Service"],
	options: {
		readonly key: string;
		readonly schema: Schema.Codec<A, I>;
		readonly value: A;
		readonly ttlSeconds: number;
	},
): Effect.Effect<void> =>
	Schema.encodeEffect(options.schema)(options.value).pipe(
		Effect.flatMap((encoded) =>
			cache
				.set(options.key, JSON.stringify(encoded), options.ttlSeconds)
				.pipe(
					Effect.catchTag("CacheTransportError", (error) =>
						Effect.logWarning(
							`cache write failed for ${options.key}: ${error.reason}`,
						),
					),
				),
		),
		Effect.catchTag("SchemaError", () => Effect.void),
	);
