import { Effect, Option, type Tracer } from "effect";
import { type PermissionRef, renderPermissionRef } from "./permission-ref.ts";

/**
 * The span attribute listing every permission checked during the call. One
 * comma-joined string rather than an array attribute: a trace store groups and
 * matches a string column without a cast.
 */
export const PERMISSION_CHECKED_ATTRIBUTE = "permission.checked";

const SEPARATOR = ",";

export function splitPermissionChecked(value: unknown): ReadonlyArray<string> {
	return typeof value === "string" && value.length > 0
		? value.split(SEPARATOR)
		: [];
}

function alreadyChecked(span: Tracer.Span): ReadonlyArray<string> {
	return splitPermissionChecked(
		span.attributes.get(PERMISSION_CHECKED_ATTRIBUTE),
	);
}

function recordOn(
	span: Tracer.Span,
	permissions: ReadonlyArray<PermissionRef>,
): Effect.Effect<void> {
	return Effect.annotateCurrentSpan(
		PERMISSION_CHECKED_ATTRIBUTE,
		[...alreadyChecked(span), ...permissions.map(renderPermissionRef)].join(
			SEPARATOR,
		),
	);
}

/**
 * Records `permissions` on the current span, then runs the fence. Recording
 * comes first because a denied check is the one worth reading back; with no
 * span open the fence runs alone.
 */
export function checked(permissions: ReadonlyArray<PermissionRef>) {
	return <A, E, R>(fence: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
		Effect.option(Effect.currentSpan).pipe(
			Effect.flatMap(
				Option.match({
					onNone: () => Effect.void,
					onSome: (span) => recordOn(span, permissions),
				}),
			),
			Effect.andThen(fence),
		);
}
