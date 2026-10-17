import { describe, expect, it } from "bun:test";
import { Option } from "effect";
import { decodeStripeEvent } from "./stripe-event.ts";

describe("decodeStripeEvent", () => {
	it("reads the envelope and leaves the object as it came", () => {
		const event = decodeStripeEvent({
			id: "evt_1Abc123",
			object: "event",
			type: "payment_intent.succeeded",
			created: 1_790_000_000,
			livemode: false,
			api_version: "2026-09-30.endive",
			data: { object: { id: "pi_3Abc123", amount: 1500 } },
		});
		expect(
			Option.map(event, ({ type, data }) => [type, data.object.id]),
		).toEqual(Option.some(["payment_intent.succeeded", "pi_3Abc123"]));
	});

	it("refuses what is not an event", () => {
		expect(Option.isNone(decodeStripeEvent({ type: "x" }))).toBe(true);
	});
});
