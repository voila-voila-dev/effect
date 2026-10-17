import { Effect } from "effect";
import type { RetryPolicy } from "./retry-policy.ts";
import { isTransientFailure } from "./retryable.ts";

/**
 * Retries a call under `policy` while its failure passes `when` (by default
 * {@link isTransientFailure}). Retrying a third party is only safe when the
 * call is idempotent, so applying this stays each call site's decision; two
 * of them compose, one per kind of failure.
 */
export function retryOutbound(
	policy: RetryPolicy,
	options: { readonly when?: (error: unknown) => boolean } = {},
) {
	const when = options.when ?? isTransientFailure;
	return <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
		Effect.retry(effect, {
			schedule: policy.schedule,
			times: policy.attempts,
			while: when,
		});
}
