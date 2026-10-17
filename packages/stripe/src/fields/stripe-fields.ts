import { Effect, Option, Predicate } from "effect";
import type { StripeObject } from "../client/stripe.ts";
import { StripeError } from "../client/stripe-error.ts";

// Typed reads of a Stripe object, which arrives as untyped JSON. Absent
// rather than coerced: "Stripe said 0" and "Stripe said nothing" must stay
// two different answers.

export function stringField(
	object: StripeObject,
	field: string,
): Option.Option<string> {
	const value = object[field];
	return typeof value === "string" ? Option.some(value) : Option.none();
}

export function numberField(
	object: StripeObject,
	field: string,
): Option.Option<number> {
	const value = object[field];
	return typeof value === "number" ? Option.some(value) : Option.none();
}

export function booleanField(
	object: StripeObject,
	field: string,
): Option.Option<boolean> {
	const value = object[field];
	return typeof value === "boolean" ? Option.some(value) : Option.none();
}

/**
 * An expanded related object. None when Stripe returned it unexpanded (a
 * bare id) or not at all: the caller asked for the expansion, so a missing
 * object means the data is not there yet.
 */
export function objectField(
	object: StripeObject,
	field: string,
): Option.Option<StripeObject> {
	const value = object[field];
	return Predicate.isObject(value) ? Option.some(value) : Option.none();
}

/** A related object's id, whether Stripe sent the id alone or the object expanded. */
export function objectIdField(
	object: StripeObject,
	field: string,
): Option.Option<string> {
	return Option.match(objectField(object, field), {
		onNone: () => stringField(object, field),
		onSome: (related) => stringField(related, "id"),
	});
}

/** The objects of a list (`{ object: "list", data: [...] }`), skipping anything that is not one. */
export function listData(list: StripeObject): ReadonlyArray<StripeObject> {
	const data = list.data;
	return Array.isArray(data) ? data.filter(Predicate.isObject) : [];
}

/** Metadata is string to string on Stripe's side; anything else is dropped. */
export function metadataField(object: StripeObject): Record<string, string> {
	const metadata = object.metadata;
	if (!Predicate.isObject(metadata)) return {};
	return Object.fromEntries(
		Object.entries(metadata).flatMap(([key, value]) =>
			typeof value === "string" ? [[key, value] as const] : [],
		),
	);
}

/** The `id` a create call answers, or a {@link StripeError} when there is none. */
export function requireId(
	object: StripeObject,
	operation: string,
): Effect.Effect<string, StripeError> {
	return Option.match(stringField(object, "id"), {
		onNone: () =>
			Effect.fail(
				new StripeError({
					message: `Stripe ${operation} answered no id`,
					status: null,
					type: null,
					code: null,
					declineCode: null,
					createdNothing: false,
				}),
			),
		onSome: Effect.succeed,
	});
}
