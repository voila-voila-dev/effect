import { Effect, Option, Schema } from "effect";
import type { KeyValueCache } from "./key-value-cache.ts";

/**
 * Reads an entry through its schema, for a cache in front of a source of
 * truth: every failure becomes `None` so the caller falls back. A miss is the
 * cold path; a transport failure is logged because it signals an outage, not
 * a miss; malformed JSON or a schema that changed since the write (a deploy)
 * read as absent rather than failing the request.
 */
export const readCachedValue = <A, I>(
	cache: KeyValueCache["Service"],
	key: string,
	schema: Schema.Codec<A, I>,
): Effect.Effect<Option.Option<A>> =>
	cache.get(key).pipe(
		Effect.catchTag("CacheTransportError", (error) =>
			Effect.logWarning(`cache read failed for ${key}: ${error.reason}`).pipe(
				Effect.andThen(Effect.fail(error)),
			),
		),
		Effect.option,
		Effect.flatMap(
			Option.match({
				onNone: () => Effect.succeedNone,
				onSome: (cached) =>
					Effect.try({
						try: (): unknown => JSON.parse(cached),
						catch: (cause) => cause,
					}).pipe(
						Effect.flatMap(Schema.decodeUnknownEffect(schema)),
						Effect.option,
					),
			}),
		),
	);
