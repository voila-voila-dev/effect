import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { ensureSuccess } from "./ensure-success.ts";
import { OutboundStatusError } from "./outbound-status-error.ts";

describe("ensureSuccess", () => {
	it("passes a 2xx response through unread", async () => {
		const response = new Response("ok", { status: 201 });

		expect(await Effect.runPromise(ensureSuccess(response))).toBe(response);
		expect(response.bodyUsed).toBe(false);
	});

	it("fails a 4xx with its status and body", async () => {
		const error = await Effect.runPromise(
			Effect.flip(
				ensureSuccess(new Response("unknown customer", { status: 404 })),
			),
		);

		expect(error).toEqual(
			new OutboundStatusError({ status: 404, body: "unknown customer" }),
		);
	});

	it("keeps only the start of a long error page", async () => {
		const error = await Effect.runPromise(
			Effect.flip(
				ensureSuccess(new Response("x".repeat(50_000), { status: 503 })),
			),
		);

		expect(error.status).toBe(503);
		expect(error.body.length).toBe(1000);
	});
});
