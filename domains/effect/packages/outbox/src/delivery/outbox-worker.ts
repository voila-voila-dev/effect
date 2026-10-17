import { Cause, type Duration, Effect } from "effect";
import type { EventChannel, Tagged } from "../event-bus/event-channel.ts";
import type { OutboxStore } from "../outbox-store/outbox-store.ts";
import {
	type ContextOf,
	DEFAULT_BATCH_SIZE,
	type DeliveryOptions,
	deliver,
	type SubscriberOf,
} from "./deliver.ts";

export interface OutboxWorkerOptions extends DeliveryOptions {
	/** The wait after a pass that found less than a full batch, and after a store failure. */
	readonly pollInterval?: Duration.Input;
}

/**
 * Delivers a channel until interrupted: a full batch is followed by another
 * pass at once, anything less by a poll. Neither a store outage nor a defect
 * ends the loop — only a shutdown does. Fork it in a scope
 * (`Layer.effectDiscard(Effect.forkScoped(outboxWorker(…)))`), or tick
 * `deliver` from a `Job` instead.
 */
export function outboxWorker<
	Event extends Tagged,
	const S extends ReadonlyArray<SubscriberOf<Event>>,
>(
	channel: EventChannel<Event>,
	subscribers: S,
	options: OutboxWorkerOptions = {},
): Effect.Effect<never, never, OutboxStore | ContextOf<S[number]>> {
	const pass = deliver(channel, subscribers, options);
	const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
	const poll = Effect.sleep(options.pollInterval ?? "1 second");
	return pass.pipe(
		Effect.flatMap((report) =>
			report.claimed < batchSize ? poll : Effect.void,
		),
		Effect.catchCause((cause) =>
			Cause.hasInterruptsOnly(cause)
				? Effect.interrupt
				: Effect.logError("outbox delivery failed", cause).pipe(
						Effect.andThen(poll),
					),
		),
		Effect.forever,
		Effect.annotateLogs({ "event.channel": channel.name }),
	);
}
