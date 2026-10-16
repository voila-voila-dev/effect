import { OutboundTransportError } from "../request/outbound-transport-error.ts";
import { OutboundStatusError } from "../response/outbound-status-error.ts";
import { OutboundTimeoutError } from "../timeout/outbound-timeout-error.ts";

// 501 is absent: a partner that does not implement a call will not start to on a retry.
const TRANSIENT_STATUSES: ReadonlySet<number> = new Set([
	408, 500, 502, 503, 504,
]);

/**
 * A failure plausibly gone on the next attempt: no answer, no answer in time,
 * or a partner reporting its own trouble. A 4xx is the partner refusing this
 * input and would be refused again.
 */
export function isTransientFailure(error: unknown): boolean {
	return (
		error instanceof OutboundTransportError ||
		error instanceof OutboundTimeoutError ||
		(error instanceof OutboundStatusError &&
			TRANSIENT_STATUSES.has(error.status))
	);
}

/** A 429, which wants a longer backoff than a transient failure. */
export function isRateLimited(error: unknown): boolean {
	return error instanceof OutboundStatusError && error.status === 429;
}
