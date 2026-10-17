import { describe, expect, it } from "bun:test";
import { OutboundTransportError } from "../request/outbound-transport-error.ts";
import { OutboundStatusError } from "../response/outbound-status-error.ts";
import { OutboundTimeoutError } from "../timeout/outbound-timeout-error.ts";
import { isRateLimited, isTransientFailure } from "./retryable.ts";

const status = (code: number) =>
	new OutboundStatusError({ status: code, body: "" });

describe("isTransientFailure", () => {
	it.each([
		new OutboundTransportError({ partner: "acme", cause: null }),
		new OutboundTimeoutError({ timeoutMilliseconds: 10 }),
		status(408),
		status(500),
		status(502),
		status(503),
		status(504),
	])("retries %p", (error) => {
		expect(isTransientFailure(error)).toBe(true);
	});

	it.each([
		status(400),
		status(401),
		status(404),
		status(422),
		status(429),
		status(501),
		new Error("a bug"),
	])("does not retry %p", (error) => {
		expect(isTransientFailure(error)).toBe(false);
	});
});

describe("isRateLimited", () => {
	it("is a 429, and only a 429", () => {
		expect(isRateLimited(status(429))).toBe(true);
		expect(isRateLimited(status(503))).toBe(false);
		expect(isRateLimited(new Error("429"))).toBe(false);
	});
});
