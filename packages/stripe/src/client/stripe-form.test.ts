import { describe, expect, it } from "bun:test";
import { encodeStripeForm } from "./stripe-form.ts";

describe("encodeStripeForm", () => {
	it("writes nested objects and arrays in bracket notation", () => {
		expect(
			decodeURIComponent(
				encodeStripeForm({
					amount: 1500,
					confirm: true,
					metadata: { order: "42" },
					expand: ["customer", "latest_charge"],
					line_items: [{ price: "price_1", quantity: 2 }],
				}),
			),
		).toBe(
			"amount=1500&confirm=true&metadata[order]=42&expand[0]=customer&expand[1]=latest_charge&line_items[0][price]=price_1&line_items[0][quantity]=2",
		);
	});

	it("leaves undefined out and sends null empty, which unsets the field", () => {
		expect(encodeStripeForm({ description: undefined, metadata: null })).toBe(
			"metadata=",
		);
	});
});
