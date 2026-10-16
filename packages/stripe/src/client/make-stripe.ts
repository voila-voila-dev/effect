import {
	DEFAULT_MAX_RESPONSE_BYTES,
	OutboundTimeout,
	outboundCall,
	RetryPolicy,
	readBoundedBytes,
	retryOutbound,
	sendOutbound,
	withTimeout,
} from "@voila.dev/http";
import { Config, Effect, Layer, Predicate, Redacted } from "effect";
import {
	readStripeFailure,
	unansweredStripeCall,
} from "./read-stripe-failure.ts";
import {
	Stripe,
	type StripeMethod,
	type StripeObject,
	type StripeRequestOptions,
} from "./stripe.ts";
import { StripeError } from "./stripe-error.ts";
import { encodeStripeForm } from "./stripe-form.ts";

const API_BASE_URL = "https://api.stripe.com/v1";

export interface StripeOptions {
	readonly secretKey: Redacted.Redacted<string>;
	/**
	 * The API version every call names (`Stripe-Version`), rather than the
	 * account default anyone can raise from the dashboard: a later version
	 * drops fields your readers expect. Moving it is a reviewed change.
	 */
	readonly apiVersion: string;
	/** The partner the requests go out as; `stripe` unless told otherwise. */
	readonly partner?: string;
	/** The backoff for a 5xx, a 409, a timeout or a dropped connection; `RetryPolicy.transient` by default. */
	readonly transientRetry?: RetryPolicy;
	/** The backoff for a 429; `RetryPolicy.rateLimited` by default. */
	readonly rateLimitedRetry?: RetryPolicy;
}

// A Stripe id: a lowercase prefix, an underscore, and a suffix with a digit
// or a capital — which `payment_intents` and `checkout/sessions` never have.
const STRIPE_ID = /^[a-z]+_(?=[A-Za-z0-9]*[A-Z0-9])[A-Za-z0-9]{6,}$/u;

/** `POST /payment_intents/:id/confirm`: the span name, ids left out so it stays low-cardinality. */
export function stripeOperation(method: StripeMethod, path: string): string {
	const template = path
		.split("?")[0]
		?.split("/")
		.map((segment) => (STRIPE_ID.test(segment) ? ":id" : segment))
		.join("/");
	return `${method} ${template}`;
}

function headersOf(
	options: StripeOptions,
	request: StripeRequestOptions,
	hasBody: boolean,
): Record<string, string> {
	return {
		authorization: `Bearer ${Redacted.value(options.secretKey)}`,
		"stripe-version": options.apiVersion,
		...(hasBody && { "content-type": "application/x-www-form-urlencoded" }),
		...(request.idempotencyKey !== undefined && {
			"idempotency-key": request.idempotencyKey,
		}),
		...(request.stripeAccount !== undefined && {
			"stripe-account": request.stripeAccount,
		}),
	};
}

const decoder = new TextDecoder();

function readBody(
	response: Response,
	operation: string,
): Effect.Effect<Record<string, unknown>, StripeError> {
	return Effect.tryPromise({
		try: async () => {
			const bytes = await readBoundedBytes(
				response,
				DEFAULT_MAX_RESPONSE_BYTES,
			);
			return bytes === null
				? null
				: (JSON.parse(decoder.decode(bytes)) as unknown);
		},
		catch: () =>
			unansweredStripeCall(
				operation,
				"answered something other than JSON",
				response.status,
			),
	}).pipe(
		Effect.flatMap((body) =>
			Predicate.isObject(body)
				? Effect.succeed(body as Record<string, unknown>)
				: Effect.fail(
						unansweredStripeCall(
							operation,
							"answered something other than an object",
							response.status,
						),
					),
		),
	);
}

const isTransient = (error: StripeError) =>
	error.status === null ||
	error.status === 409 ||
	(error.status >= 500 && error.status !== 501);

/**
 * {@link Stripe} over its REST API. Each attempt is bounded by
 * `OutboundTimeout.roundTrip`. A call is retried only when retrying is safe —
 * a GET, or a call with an idempotency key — on a 5xx, a 409, a timeout or a
 * dropped connection, and on a 429 with a longer backoff.
 */
export function makeStripe(options: StripeOptions): typeof Stripe.Service {
	const partner = options.partner ?? "stripe";
	const transientRetry = options.transientRetry ?? RetryPolicy.transient;
	const rateLimitedRetry = options.rateLimitedRetry ?? RetryPolicy.rateLimited;

	return {
		request: (method, path, request = {}) => {
			const operation = request.operation ?? stripeOperation(method, path);
			const query =
				request.query === undefined ? "" : encodeStripeForm(request.query);
			const url = `${API_BASE_URL}${path}${query === "" ? "" : `?${query}`}`;
			const body =
				request.form === undefined ? undefined : encodeStripeForm(request.form);
			const safe = method === "GET" || request.idempotencyKey !== undefined;

			const attempt = sendOutbound(partner, url, {
				method,
				headers: headersOf(options, request, body !== undefined),
				...(body !== undefined && { body }),
			}).pipe(
				Effect.flatMap((response) =>
					readBody(response, operation).pipe(
						Effect.flatMap(
							(answer): Effect.Effect<StripeObject, StripeError> =>
								response.ok
									? Effect.succeed(answer)
									: Effect.fail(
											readStripeFailure(operation, response.status, answer),
										),
						),
					),
				),
				withTimeout(OutboundTimeout.roundTrip),
				Effect.catchTags({
					OutboundTransportError: (error) =>
						Effect.fail(
							unansweredStripeCall(
								operation,
								`request failed: ${String(error.cause)}`,
							),
						),
					OutboundTimeoutError: (error) =>
						Effect.fail(
							unansweredStripeCall(
								operation,
								`did not answer within ${error.timeoutMilliseconds}ms`,
							),
						),
				}),
			);

			return attempt.pipe(
				retryOutbound(transientRetry, {
					when: (error) =>
						safe && error instanceof StripeError && isTransient(error),
				}),
				retryOutbound(rateLimitedRetry, {
					when: (error) =>
						safe && error instanceof StripeError && error.status === 429,
				}),
				outboundCall({ partner, operation }),
			);
		},
	};
}

/** {@link makeStripe} as the {@link Stripe} layer. */
export function stripeLayer(options: StripeOptions): Layer.Layer<Stripe> {
	return Layer.succeed(Stripe, makeStripe(options));
}

/** {@link stripeLayer} with the secret key read from `STRIPE_SECRET_KEY`. */
export function stripeFromConfig(options: {
	readonly apiVersion: string;
}): Layer.Layer<Stripe, Config.ConfigError> {
	return Layer.unwrap(
		Effect.map(Config.Redacted("STRIPE_SECRET_KEY"), (secretKey) =>
			stripeLayer({ ...options, secretKey }),
		),
	);
}
