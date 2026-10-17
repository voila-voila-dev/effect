import { Effect, Layer } from "effect";
import {
	Stripe,
	type StripeMethod,
	type StripeObject,
	type StripeRequestOptions,
} from "../client/stripe.ts";
import { StripeError } from "../client/stripe-error.ts";

export interface ScriptedCall {
	readonly method: StripeMethod;
	readonly path: string;
	readonly options: StripeRequestOptions;
}

type Answer = (
	call: ScriptedCall,
) => StripeObject | Effect.Effect<StripeObject, StripeError>;

/**
 * A {@link Stripe} answering from a script, for tests. `on(method, path,
 * answer)` registers an answer: an object, or an effect (a `StripeError` for
 * a refusal); the path matches exactly or, as a RegExp, by test. A call
 * nothing answers fails as Stripe's `resource_missing` would. `calls` lists
 * every request, so a test reads what was sent.
 */
export function scriptedStripe() {
	const routes: Array<{
		readonly method: StripeMethod;
		readonly path: string | RegExp;
		readonly answer: Answer;
	}> = [];
	const calls: Array<ScriptedCall> = [];

	const service: typeof Stripe.Service = {
		request: (method, path, options = {}) =>
			Effect.suspend(() => {
				const call = { method, path, options };
				calls.push(call);
				const route = routes.findLast(
					(each) =>
						each.method === method &&
						(typeof each.path === "string"
							? each.path === path
							: each.path.test(path)),
				);
				if (route === undefined) {
					return Effect.fail(
						new StripeError({
							message: `Stripe ${method} ${path} answered 404: no scripted answer`,
							status: 404,
							type: "invalid_request_error",
							code: "resource_missing",
							declineCode: null,
							createdNothing: true,
						}),
					);
				}
				const answer = route.answer(call);
				return Effect.isEffect(answer) ? answer : Effect.succeed(answer);
			}),
	};

	return {
		calls,
		on: (method: StripeMethod, path: string | RegExp, answer: Answer) => {
			routes.push({ method, path, answer });
		},
		service,
		layer: Layer.succeed(Stripe, service),
	};
}
