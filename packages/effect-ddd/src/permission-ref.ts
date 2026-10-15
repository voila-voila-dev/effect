import { Effect, Option, type Tracer } from "effect";

/**
 * One permission a gate asks for, in a shape a catalogue can index:
 * `{ kind: "organization", name: "invoice.manage" }`,
 * `{ kind: "actor", name: "system" }`. The kinds and names are the
 * application's own vocabulary.
 */
export interface PermissionRef {
	readonly kind: string;
	readonly name: string;
}

export function permissionRef(kind: string, name: string): PermissionRef {
	return { kind, name };
}

export function renderPermissionRef(ref: PermissionRef): string {
	return `${ref.kind}:${ref.name}`;
}

/**
 * The span attribute listing every permission a gate checked during the call.
 * One comma-joined string rather than an array attribute: a trace store groups
 * and matches a string column without a cast.
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
					onSome: (span) =>
						Effect.annotateCurrentSpan(
							PERMISSION_CHECKED_ATTRIBUTE,
							[
								...alreadyChecked(span),
								...permissions.map(renderPermissionRef),
							].join(SEPARATOR),
						),
				}),
			),
			Effect.andThen(fence),
		);
}
