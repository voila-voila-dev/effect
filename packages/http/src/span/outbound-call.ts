import { Duration, Effect } from "effect";

/**
 * Wraps one call to a third party in a span named
 * `outbound.<partner>.<operation>` and logs its outcome, so a slow request
 * says which dependency ate the time without instrumenting each call site.
 *
 * A success logs at debug (a line per call is too much at production volume);
 * a failure at warning, since a failing dependency is worth seeing even when
 * the caller degrades around it. Attributes must stay low-cardinality and free
 * of personal data: an operation name or a country code, never a query string.
 */
export function outboundCall(options: {
	readonly partner: string;
	readonly operation: string;
	readonly attributes?: Readonly<Record<string, unknown>>;
}) {
	const label = `${options.partner}.${options.operation}`;
	return <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
		Effect.timed(effect).pipe(
			Effect.tap(([elapsed]) =>
				Effect.logDebug(
					`outbound ${label} succeeded in ${Math.round(Duration.toMillis(elapsed))}ms`,
				),
			),
			Effect.map(([, value]) => value),
			Effect.tapError((error) =>
				Effect.logWarning(`outbound ${label} failed: ${String(error)}`),
			),
			Effect.withSpan(`outbound.${label}`, {
				attributes: {
					"outbound.partner": options.partner,
					"outbound.operation": options.operation,
					...options.attributes,
				},
			}),
		);
}
