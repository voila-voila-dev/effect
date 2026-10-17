import { Cause, Duration, Effect, Exit } from "effect";
import {
	decodeEvent,
	type EventChannel,
	type Tagged,
} from "../event-bus/event-channel.ts";
import {
	type OutboxMessage,
	OutboxStore,
} from "../outbox-store/outbox-store.ts";
import type { OutboxStoreError } from "../outbox-store/outbox-store-error.ts";
import type { DeliveryMetadata, Subscriber } from "../subscriber/subscriber.ts";
import { type Backoff, exponentialBackoff } from "./backoff.ts";

export const DEFAULT_BATCH_SIZE = 100;

export interface DeliveryOptions {
	/** Messages claimed per pass; bounds the work a pass holds a lease on. */
	readonly batchSize?: number;
	/** Longer than the slowest pass, or a second worker takes the same messages. */
	readonly lease?: Duration.Input;
	/** Failed deliveries before a message is parked. */
	readonly maxAttempts?: number;
	readonly backoff?: Backoff;
	/** Messages handled at once within a pass; ordering is not kept beyond 1. */
	readonly concurrency?: number;
}

export interface DeliveryReport {
	readonly claimed: number;
	readonly delivered: number;
	readonly retried: number;
	readonly parked: number;
}

type Outcome = "delivered" | "retried" | "parked";

/** One subscriber per member of the union: a subscriber of any member (or several) fits. */
export type SubscriberOf<Event extends Tagged> = Event extends unknown
	? Subscriber<Event, unknown>
	: never;

/**
 * Read off each element rather than inferred from the array: `R` is
 * covariant, so a plain `Subscriber<Event, R>[]` parameter makes TypeScript
 * pick one subscriber's services for all of them.
 */
export type ContextOf<S> = S extends Subscriber<never, infer R> ? R : never;

function duplicateName(names: ReadonlyArray<string>): string | undefined {
	return names.find((name, index) => names.indexOf(name) !== index);
}

/**
 * One pass over a channel: claim, decode, run every subscriber of the event's
 * tag, then settle each message. A message that does not decode is parked at
 * once, since no retry will change its bytes; one whose subscriber fails is
 * retried with backoff until `maxAttempts`, then parked.
 *
 * Refuses duplicate subscriber names when called — the list is its own wiring
 * test.
 */
export function deliver<
	Event extends Tagged,
	const S extends ReadonlyArray<SubscriberOf<Event>>,
>(
	channel: EventChannel<Event>,
	subscribers: S,
	options: DeliveryOptions = {},
): Effect.Effect<
	DeliveryReport,
	OutboxStoreError,
	OutboxStore | ContextOf<S[number]>
> {
	type R = ContextOf<S[number]>;
	// The parameter type checked each subscriber's event against the channel's
	// union; the tag filter below is the runtime half of that check.
	// biome-ignore lint/suspicious/noExplicitAny: widening each subscriber's event to the union is safe behind the tag filter.
	const listed = subscribers as ReadonlyArray<Subscriber<any, R>>;
	const duplicate = duplicateName(listed.map((subscriber) => subscriber.name));
	if (duplicate !== undefined) {
		throw new Error(`duplicate subscriber name: ${duplicate}`);
	}
	const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
	const lease = Duration.fromInputUnsafe(options.lease ?? "5 minutes");
	const maxAttempts = options.maxAttempts ?? 5;
	const backoff = options.backoff ?? exponentialBackoff();

	// Every sibling runs before the message fails: a subscriber early in the
	// list must not starve the ones after it of every attempt.
	function dispatch(event: Event, metadata: DeliveryMetadata) {
		return Effect.forEach(
			listed.filter((subscriber) => subscriber.tags.includes(event._tag)),
			(subscriber) =>
				subscriber.run(event, metadata).pipe(
					Effect.tapCause((cause) =>
						Cause.hasInterruptsOnly(cause)
							? Effect.void
							: Effect.logError("subscriber failed", cause).pipe(
									Effect.annotateLogs({ subscriber: subscriber.name }),
								),
					),
					Effect.exit,
				),
		).pipe(
			Effect.flatMap((exits) => {
				const failed = exits.find(Exit.isFailure);
				return failed === undefined
					? Effect.void
					: Effect.failCause(failed.cause);
			}),
		);
	}

	return Effect.gen(function* () {
		const store = yield* OutboxStore;

		function settle(
			message: OutboxMessage,
			exit: Exit.Exit<void, unknown>,
		): Effect.Effect<Outcome, OutboxStoreError> {
			if (Exit.isSuccess(exit)) {
				return Effect.as(store.complete([message.id]), "delivered");
			}
			const error = Cause.pretty(exit.cause);
			return message.attempts >= maxAttempts
				? store.park(message.id, { error }).pipe(
						Effect.tap(() => Effect.logError("message parked", exit.cause)),
						Effect.as("parked"),
					)
				: store
						.retry(message.id, { after: backoff(message.attempts), error })
						.pipe(Effect.as("retried"));
		}

		function handle(
			message: OutboxMessage,
		): Effect.Effect<Outcome, OutboxStoreError, R> {
			const metadata = { id: message.id, attempts: message.attempts };
			return decodeEvent(channel, message.payload).pipe(
				Effect.matchEffect({
					onFailure: (error) =>
						store
							.park(message.id, { error: `does not decode: ${error.message}` })
							.pipe(
								Effect.tap(() => Effect.logError("message parked", error)),
								Effect.as("parked" as const),
							),
					onSuccess: (event) =>
						Effect.flatMap(Effect.exit(dispatch(event, metadata)), (exit) =>
							// A shutdown is not a failed attempt: the lease hands the
							// message to the next worker.
							Exit.isFailure(exit) && Cause.hasInterruptsOnly(exit.cause)
								? Effect.interrupt
								: settle(message, exit),
						),
				}),
				Effect.annotateLogs({
					"event.id": message.id,
					"event.tag": message.tag,
					"event.attempt": message.attempts,
				}),
			);
		}

		const claimed = yield* store.claim({
			channel: channel.name,
			limit: batchSize,
			lease,
		});
		const outcomes = yield* Effect.forEach(claimed, handle, {
			concurrency: options.concurrency ?? 1,
		});
		const count = (outcome: Outcome) =>
			outcomes.filter((each) => each === outcome).length;
		return {
			claimed: claimed.length,
			delivered: count("delivered"),
			retried: count("retried"),
			parked: count("parked"),
		};
	}).pipe(
		Effect.annotateLogs({ "event.channel": channel.name }),
		Effect.withSpan("outbox.deliver", {
			attributes: { "event.channel": channel.name },
		}),
	);
}
