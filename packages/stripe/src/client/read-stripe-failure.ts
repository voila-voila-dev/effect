import { Predicate } from "effect";
import { StripeError } from "./stripe-error.ts";

function stringOf(
	object: Record<string, unknown> | null,
	key: string,
): string | null {
	const value = object?.[key];
	return typeof value === "string" ? value : null;
}

/** A not-OK answer from Stripe, read into a {@link StripeError}. */
export function readStripeFailure(
	operation: string,
	status: number,
	body: Record<string, unknown>,
): StripeError {
	const error = Predicate.isObject(body.error) ? body.error : null;
	const type = stringOf(error, "type");
	const message = stringOf(error, "message");
	return new StripeError({
		message: `Stripe ${operation} answered ${status}${message === null ? "" : `: ${message}`}`,
		status,
		type,
		code: stringOf(error, "code"),
		declineCode: stringOf(error, "decline_code"),
		createdNothing:
			status >= 400 &&
			status < 500 &&
			status !== 409 &&
			type !== "idempotency_error",
	});
}

/** A call Stripe never answered, or answered unreadably: it may have acted. */
export function unansweredStripeCall(
	operation: string,
	reason: string,
	status: number | null = null,
): StripeError {
	return new StripeError({
		message: `Stripe ${operation} ${reason}`,
		status,
		type: null,
		code: null,
		declineCode: null,
		createdNothing: false,
	});
}
