import { describe, expect, it } from "bun:test";
import { Effect, Option } from "effect";
import {
	listData,
	metadataField,
	numberField,
	objectIdField,
	requireId,
	stringField,
} from "./stripe-fields.ts";

const intent = {
	id: "pi_3Abc123",
	amount: 0,
	customer: { id: "cus_1Abc123", email: "marie@example.fr" },
	latest_charge: "ch_3Abc123",
	metadata: { order: "42", count: 3 },
};

describe("field readers", () => {
	it("tell a zero from nothing", () => {
		expect(numberField(intent, "amount")).toEqual(Option.some(0));
		expect(numberField(intent, "amount_received")).toEqual(Option.none());
		expect(stringField(intent, "amount")).toEqual(Option.none());
	});

	it("read a related id whether Stripe expanded the object or not", () => {
		expect(objectIdField(intent, "customer")).toEqual(
			Option.some("cus_1Abc123"),
		);
		expect(objectIdField(intent, "latest_charge")).toEqual(
			Option.some("ch_3Abc123"),
		);
	});

	it("keep only string metadata, and only objects from a list", () => {
		expect(metadataField(intent)).toEqual({ order: "42" });
		expect(listData({ object: "list", data: [intent, "junk", null] })).toEqual([
			intent,
		]);
	});

	it("fail a create answer with no id", async () => {
		expect(
			await Effect.runPromise(requireId(intent, "POST /payment_intents")),
		).toBe("pi_3Abc123");
		const error = await Effect.runPromise(
			Effect.flip(requireId({}, "POST /payment_intents")),
		);
		expect(error.message).toContain("answered no id");
	});
});
