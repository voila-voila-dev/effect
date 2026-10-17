import { unitMetrics } from "@voila.dev/effect-ddd";
import { Effect } from "effect";
import type { Tagged } from "../event-bus/event-channel.ts";

export interface DeliveryMetadata {
	/** The same on every redelivery of a message: an idempotency key for the side effect. */
	readonly id: string;
	readonly attempts: number;
}

export interface Subscriber<Event extends Tagged, R> {
	/** Unique; the span name, the metric tag and the log annotation. */
	readonly name: string;
	readonly tags: ReadonlyArray<string>;
	readonly run: (
		event: Event,
		metadata: DeliveryMetadata,
	) => Effect.Effect<void, unknown, R>;
}

export const Subscriber = {
	/**
	 * Delivery is at least once: `run` may see the same event again after a
	 * crash or a sibling's failure, so it stays idempotent. `Event` is read off
	 * `run`'s parameter, so the file names the event it reacts to.
	 */
	make: <
		Event extends Tagged,
		const Tag extends Event["_tag"],
		A,
		E,
		R,
	>(options: {
		readonly name: string;
		readonly tag: Tag | ReadonlyArray<Tag>;
		readonly run: (
			event: Event,
			metadata: DeliveryMetadata,
		) => Effect.Effect<A, E, R>;
	}): Subscriber<Event, R> => {
		const metrics = unitMetrics("subscriber", options.name);
		return {
			name: options.name,
			tags: typeof options.tag === "string" ? [options.tag] : options.tag,
			run: (event, metadata) =>
				options.run(event, metadata).pipe(
					Effect.asVoid,
					metrics.track,
					Effect.annotateLogs({ subscriber: options.name }),
					Effect.withSpan(`subscriber.${options.name}`, {
						attributes: {
							"event.id": metadata.id,
							"event.attempt": metadata.attempts,
						},
					}),
				),
		};
	},
};
