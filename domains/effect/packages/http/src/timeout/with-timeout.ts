import { Duration, Effect } from "effect";
import { OutboundTimeoutError } from "./outbound-timeout-error.ts";

/**
 * Deadlines for a call to a third party. Without one a stalled partner is not
 * an error but an unbounded wait: the request that triggered it, its fiber
 * and its pooled resources stay pinned until the socket dies on its own.
 */
export const OutboundTimeout = {
	/** A partner answering in one request/response round trip. */
	roundTrip: Duration.seconds(15),
	/** A model call or a file download, which legitimately take tens of seconds. */
	long: Duration.seconds(60),
} as const;

/**
 * Fails with {@link OutboundTimeoutError} once `timeout` passes, interrupting
 * the call (which aborts its request). Placed inside a retry it bounds each
 * attempt; outside, the whole sequence.
 */
export function withTimeout(timeout: Duration.Input) {
	const timeoutMilliseconds = Duration.toMillis(timeout);
	return <A, E, R>(
		effect: Effect.Effect<A, E, R>,
	): Effect.Effect<A, E | OutboundTimeoutError, R> =>
		Effect.timeoutOrElse(effect, {
			duration: timeout,
			orElse: () =>
				Effect.fail(new OutboundTimeoutError({ timeoutMilliseconds })),
		});
}
