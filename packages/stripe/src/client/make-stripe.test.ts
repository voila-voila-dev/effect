import { describe, expect, it } from "bun:test";
import { type Fetch, OutboundFetch, retryPolicy } from "@voila.dev/http";
import { Effect, Redacted } from "effect";
import { makeStripe, stripeOperation } from "./make-stripe.ts";
import { rejectDeclinedCards } from "./stripe-card-declined-error.ts";

const fast = retryPolicy({
	attempts: 2,
	initialDelay: "1 millis",
	maximumDelay: "1 millis",
});

const stripe = makeStripe({
	secretKey: Redacted.make("sk_test"),
	apiVersion: "2026-09-30.endive",
	transientRetry: fast,
	rateLimitedRetry: fast,
});

interface Call {
	readonly method: string | undefined;
	readonly url: string;
	readonly headers: Headers;
	readonly body: string | undefined;
}

function answering(...answers: ReadonlyArray<[number, unknown] | Error>) {
	const calls: Array<Call> = [];
	const fetch: Fetch = async (input, init) => {
		calls.push({
			method: init?.method,
			url: String(input),
			headers: new Headers(init?.headers),
			body: typeof init?.body === "string" ? init.body : undefined,
		});
		const answer = answers[Math.min(calls.length, answers.length) - 1];
		if (answer instanceof Error) throw answer;
		const [status, body] = answer ?? [200, {}];
		return new Response(
			typeof body === "string" ? body : JSON.stringify(body),
			{
				status,
			},
		);
	};
	return { calls, fetch };
}

function run<A, E>(stub: { fetch: Fetch }, effect: Effect.Effect<A, E>) {
	return Effect.runPromise(
		Effect.result(effect).pipe(
			Effect.provideService(OutboundFetch, () => stub.fetch),
		),
	);
}

function failure<A, E>(result: { _tag: string; failure?: E; success?: A }) {
	if (result._tag !== "Failure") throw new Error("expected a failure");
	return result.failure as E;
}

const declined = (declineCode?: string) =>
	[
		402,
		{
			error: {
				type: "card_error",
				code: "card_declined",
				message: "Your card was declined.",
				...(declineCode && { decline_code: declineCode }),
			},
		},
	] as [number, unknown];

describe("request", () => {
	it("sends the key, the pinned version, the form and the headers asked for", async () => {
		const stub = answering([
			200,
			{ id: "pi_3Abc123", object: "payment_intent" },
		]);
		const result = await run(
			stub,
			stripe.request("POST", "/payment_intents", {
				form: { amount: 1500, currency: "eur", metadata: { order: "42" } },
				idempotencyKey: "order-42",
				stripeAccount: "acct_1Xyz789",
			}),
		);
		expect(result).toMatchObject({
			_tag: "Success",
			success: { id: "pi_3Abc123" },
		});
		const [call] = stub.calls;
		expect(call?.url).toBe("https://api.stripe.com/v1/payment_intents");
		expect(call?.method).toBe("POST");
		expect(call?.headers.get("authorization")).toBe("Bearer sk_test");
		expect(call?.headers.get("stripe-version")).toBe("2026-09-30.endive");
		expect(call?.headers.get("idempotency-key")).toBe("order-42");
		expect(call?.headers.get("stripe-account")).toBe("acct_1Xyz789");
		expect(call?.headers.get("content-type")).toBe(
			"application/x-www-form-urlencoded",
		);
		expect(decodeURIComponent(call?.body ?? "")).toBe(
			"amount=1500&currency=eur&metadata[order]=42",
		);
	});

	it("puts a GET's query in the URL and sends no body", async () => {
		const stub = answering([200, { object: "list", data: [] }]);
		await run(
			stub,
			stripe.request("GET", "/transfers", {
				query: { limit: 100, expand: ["data.destination"] },
			}),
		);
		expect(decodeURIComponent(stub.calls[0]?.url ?? "")).toBe(
			"https://api.stripe.com/v1/transfers?limit=100&expand[0]=data.destination",
		);
		expect(stub.calls[0]?.body).toBeUndefined();
	});

	it("reads a plain 4xx as a request Stripe refused before creating anything", async () => {
		const stub = answering([
			400,
			{
				error: {
					type: "invalid_request_error",
					code: "resource_missing",
					message: "No such mandate",
				},
			},
		]);
		expect(
			failure(await run(stub, stripe.request("POST", "/payment_intents"))),
		).toMatchObject({
			_tag: "StripeError",
			status: 400,
			type: "invalid_request_error",
			code: "resource_missing",
			createdNothing: true,
		});
	});

	it("reads a reused key's idempotency_error, and a 409, as calls that may have acted", async () => {
		const reused = answering([
			400,
			{
				error: {
					type: "idempotency_error",
					message:
						"Keys for idempotent requests can only be used with the same parameters",
				},
			},
		]);
		expect(
			failure(await run(reused, stripe.request("POST", "/payment_intents"))),
		).toMatchObject({ createdNothing: false });
		const inProgress = answering([409, { error: { type: "api_error" } }]);
		expect(
			failure(
				await run(inProgress, stripe.request("POST", "/payment_intents")),
			),
		).toMatchObject({ status: 409, createdNothing: false });
	});

	it("reads an answer that is not JSON, and a dropped connection, as calls that may have acted", async () => {
		expect(
			failure(
				await run(
					answering([502, "<html>bad gateway</html>"]),
					stripe.request("POST", "/refunds"),
				),
			),
		).toMatchObject({ status: 502, createdNothing: false });
		expect(
			failure(
				await run(
					answering(new TypeError("fetch failed")),
					stripe.request("POST", "/refunds"),
				),
			),
		).toMatchObject({ status: null, createdNothing: false });
	});
});

describe("retries", () => {
	it("retries a GET after a 5xx and a 429", async () => {
		const stub = answering(
			[500, { error: { type: "api_error" } }],
			[429, { error: { type: "rate_limit_error" } }],
			[200, { object: "balance" }],
		);
		expect(await run(stub, stripe.request("GET", "/balance"))).toMatchObject({
			_tag: "Success",
		});
		expect(stub.calls).toHaveLength(3);
	});

	it("retries a POST that carries an idempotency key", async () => {
		const stub = answering(new TypeError("fetch failed"), [
			200,
			{ id: "re_1Abc123" },
		]);
		expect(
			await run(
				stub,
				stripe.request("POST", "/refunds", { idempotencyKey: "refund-1" }),
			),
		).toMatchObject({ _tag: "Success" });
		expect(stub.calls).toHaveLength(2);
		expect(stub.calls[1]?.headers.get("idempotency-key")).toBe("refund-1");
	});

	it("never retries a POST without one, which could act twice", async () => {
		const stub = answering([500, { error: { type: "api_error" } }]);
		await run(stub, stripe.request("POST", "/refunds"));
		expect(stub.calls).toHaveLength(1);
	});

	it("does not retry a refusal", async () => {
		const stub = answering([400, { error: { type: "invalid_request_error" } }]);
		await run(stub, stripe.request("GET", "/customers/cus_1Abc123"));
		expect(stub.calls).toHaveLength(1);
	});
});

describe("rejectDeclinedCards", () => {
	const charge = () =>
		stripe
			.request("POST", "/payment_intents", { idempotencyKey: "charge-1" })
			.pipe(rejectDeclinedCards);

	it("reads a refused card as the issuer's answer, with its reason", async () => {
		expect(
			failure(await run(answering(declined("insufficient_funds")), charge())),
		).toMatchObject({
			_tag: "StripeCardDeclinedError",
			declineCode: "insufficient_funds",
		});
	});

	it("falls back on Stripe's code when the issuer gave no reason", async () => {
		expect(failure(await run(answering(declined()), charge()))).toMatchObject({
			_tag: "StripeCardDeclinedError",
			declineCode: "card_declined",
		});
	});

	it("leaves any other failure a StripeError", async () => {
		expect(
			failure(
				await run(
					answering([400, { error: { type: "invalid_request_error" } }]),
					charge(),
				),
			),
		).toMatchObject({ _tag: "StripeError" });
	});

	it("is applied per call: a plain call reads a card error as a StripeError", async () => {
		expect(
			failure(
				await run(
					answering(declined("expired_card")),
					stripe.request("POST", "/payment_intents"),
				),
			),
		).toMatchObject({
			_tag: "StripeError",
			type: "card_error",
			declineCode: "expired_card",
		});
	});
});

describe("stripeOperation", () => {
	it("replaces ids with :id and keeps resource names", () => {
		expect(
			stripeOperation("POST", "/payment_intents/pi_3Nabc123XYZ/confirm"),
		).toBe("POST /payment_intents/:id/confirm");
		expect(stripeOperation("GET", "/checkout/sessions?limit=3")).toBe(
			"GET /checkout/sessions",
		);
		expect(
			stripeOperation("GET", "/accounts/acct_1Abc234/external_accounts"),
		).toBe("GET /accounts/:id/external_accounts");
	});
});
