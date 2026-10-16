import { Effect, Schema } from "effect";

export interface Tagged {
	readonly _tag: string;
}

/**
 * Where a family of events travels, and how it is written down. The bus that
 * publishes and the worker that delivers share it, so both read the same name
 * and the same schema.
 */
export interface EventChannel<Event extends Tagged> {
	readonly name: string;
	/** Usually a `Schema.Union` of the context's `Schema.TaggedClass` events. */
	readonly schema: Schema.Codec<Event, unknown, never, never>;
}

/** An event the channel's own schema cannot encode is a bug in that schema, not a runtime condition. */
export function encodeEvent<Event extends Tagged>(
	channel: EventChannel<Event>,
	event: Event,
): Effect.Effect<unknown> {
	return Schema.encodeUnknownEffect(Schema.toCodecJson(channel.schema))(
		event,
	).pipe(Effect.orDie);
}

export function decodeEvent<Event extends Tagged>(
	channel: EventChannel<Event>,
	payload: unknown,
): Effect.Effect<Event, Schema.SchemaError> {
	return Schema.decodeUnknownEffect(Schema.toCodecJson(channel.schema))(
		payload,
	);
}
