import { describe, expect, it } from "bun:test";
import { Effect, Schema } from "effect";
import { decodeJsonResponse } from "./decode-json-response.ts";
import { ResponseDecodeError } from "./response-decode-error.ts";
import { ResponseTooLargeError } from "./response-too-large-error.ts";

const Customer = Schema.Struct({ id: Schema.String, balance: Schema.Number });

function decoding(body: string, maxBytes?: number) {
	return decodeJsonResponse(
		Customer,
		maxBytes === undefined ? {} : { maxBytes },
	)(new Response(body));
}

function failureOf(body: string, maxBytes?: number) {
	return Effect.runPromise(Effect.flip(decoding(body, maxBytes)));
}

describe("decodeJsonResponse", () => {
	it("decodes a body of the schema's shape", async () => {
		expect(
			await Effect.runPromise(decoding('{"id":"cus_1","balance":12}')),
		).toEqual({ id: "cus_1", balance: 12 });
	});

	it("fails typed on a body of another shape", async () => {
		expect(await failureOf('{"id":"cus_1"}')).toBeInstanceOf(
			ResponseDecodeError,
		);
	});

	it("fails typed on a body that is not JSON", async () => {
		expect(await failureOf("<html>maintenance</html>")).toBeInstanceOf(
			ResponseDecodeError,
		);
	});

	it("refuses a body past the bound without decoding it", async () => {
		expect(await failureOf('{"id":"cus_1","balance":12}', 5)).toEqual(
			new ResponseTooLargeError({ maxBytes: 5 }),
		);
	});
});
