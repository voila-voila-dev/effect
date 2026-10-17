import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { Stripe } from "../client/stripe.ts";
import { StripeError } from "../client/stripe-error.ts";
import { scriptedStripe } from "./scripted-stripe.ts";

describe("scriptedStripe", () => {
	it("answers from its script, the latest matching route first, and records each call", async () => {
		const stripe = scriptedStripe();
		stripe.on("GET", /^\/customers\//u, () => ({ id: "cus_old" }));
		stripe.on("GET", "/customers/cus_1Abc123", () => ({ id: "cus_1Abc123" }));
		stripe.on("POST", "/refunds", ({ options }) =>
			Effect.fail(
				new StripeError({
					message: `refused ${String(options.form?.amount)}`,
					status: 400,
					type: "invalid_request_error",
					code: null,
					declineCode: null,
					createdNothing: true,
				}),
			),
		);
		const [customer, refund, missing] = await Effect.runPromise(
			Effect.gen(function* () {
				const client = yield* Stripe;
				return [
					yield* client.request("GET", "/customers/cus_1Abc123"),
					yield* Effect.flip(
						client.request("POST", "/refunds", { form: { amount: 5 } }),
					),
					yield* Effect.flip(
						client.request("DELETE", "/customers/cus_1Abc123"),
					),
				] as const;
			}).pipe(Effect.provide(stripe.layer)),
		);
		expect(customer.id).toBe("cus_1Abc123");
		expect(refund.message).toBe("refused 5");
		expect(missing).toMatchObject({ status: 404, code: "resource_missing" });
		expect(stripe.calls.map(({ method, path }) => `${method} ${path}`)).toEqual(
			[
				"GET /customers/cus_1Abc123",
				"POST /refunds",
				"DELETE /customers/cus_1Abc123",
			],
		);
	});
});
