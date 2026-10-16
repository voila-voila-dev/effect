import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { outboundCall } from "./outbound-call.ts";

const call = outboundCall({
	partner: "acme",
	operation: "customers.retrieve",
	attributes: { "acme.region": "eu" },
});

describe("outboundCall", () => {
	it("runs the call inside a span named after the partner and operation", async () => {
		const span = await Effect.runPromise(Effect.currentSpan.pipe(call));

		expect(span.name).toBe("outbound.acme.customers.retrieve");
		expect(Object.fromEntries(span.attributes)).toMatchObject({
			"outbound.partner": "acme",
			"outbound.operation": "customers.retrieve",
			"acme.region": "eu",
		});
	});

	it("hands back the call's value and its failure unchanged", async () => {
		expect(await Effect.runPromise(Effect.succeed(42).pipe(call))).toBe(42);
		expect(
			await Effect.runPromise(Effect.flip(Effect.fail("down").pipe(call))),
		).toBe("down");
	});
});
