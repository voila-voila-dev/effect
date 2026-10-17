import { describe, expect, it } from "bun:test";
import { OutboundFetch, retryPolicy } from "@voila.dev/http";
import { DateTime, Effect, Exit, Option } from "effect";
import type { ViesCountryCode } from "../registry/vies-country-code.ts";
import {
	type AnsweringFetch,
	answeringFetch,
} from "./answering-fetch.test-helper.ts";
import invalid from "./fixtures/vies-check-vat-number-LU00000000.json" with {
	type: "json",
};
import valid from "./fixtures/vies-check-vat-number-LU20260743.json" with {
	type: "json",
};
import malformed from "./fixtures/vies-check-vat-number-malformed.json" with {
	type: "json",
};
import saturated from "./fixtures/vies-check-vat-number-ms-max-concurrent-req.json" with {
	type: "json",
};
import { makeVies } from "./make-vies.ts";

const vies = makeVies({
	retry: retryPolicy({
		attempts: 2,
		initialDelay: "1 millis",
		maximumDelay: "1 millis",
	}),
});

function answering(payload: unknown, status = 200) {
	return answeringFetch(
		() =>
			new Response(
				typeof payload === "string" ? payload : JSON.stringify(payload),
				{ status },
			),
	);
}

function check(
	stub: AnsweringFetch,
	vatNumber: string,
	countryCode: ViesCountryCode = "LU",
) {
	return vies
		.checkVatNumber({ countryCode, vatNumber })
		.pipe(Effect.provideService(OutboundFetch, () => stub.fetch));
}

async function failureOf(stub: AnsweringFetch) {
	const exit = await Effect.runPromiseExit(check(stub, "20260743"));
	return Exit.isFailure(exit) ? String(exit.cause) : "succeeded";
}

describe("checkVatNumber", () => {
	it("reads a valid number with the name and address the member state publishes", async () => {
		const stub = answering(valid);
		const found = await Effect.runPromise(check(stub, "20260743"));
		expect(stub.bodies[0]).toEqual({
			countryCode: "LU",
			vatNumber: "20260743",
		});
		expect(found.countryCode).toBe("LU");
		expect(found.vatNumber).toBe("20260743");
		expect(found.valid).toBe(true);
		expect(found.name).toEqual(Option.some("AMAZON EU SARL"));
		expect(found.address).toEqual(
			Option.some("38, AVENUE JOHN F. KENNEDY\nL-1855  LUXEMBOURG"),
		);
		expect(DateTime.formatIso(found.requestDate)).toBe(
			"2026-09-24T09:37:37.654Z",
		);
	});

	it("reads an invalid number with no name and no address", async () => {
		const found = await Effect.runPromise(
			check(answering(invalid), "00000000"),
		);
		expect(found.valid).toBe(false);
		expect(found.name).toEqual(Option.none());
		expect(found.address).toEqual(Option.none());
	});

	it("reads the withheld marker as no name", async () => {
		const found = await Effect.runPromise(
			check(answering({ ...valid, name: "---", address: "---" }), "20260743"),
		);
		expect(found.valid).toBe(true);
		expect(found.name).toEqual(Option.none());
		expect(found.address).toEqual(Option.none());
	});

	it("asks for Greece under its VAT prefix", async () => {
		const stub = answering({ ...valid, countryCode: "EL" });
		const found = await Effect.runPromise(check(stub, "094014201", "GR"));
		expect(stub.bodies[0]).toEqual({
			countryCode: "EL",
			vatNumber: "094014201",
		});
		expect(found.countryCode).toBe("GR");
	});

	it("retries, then fails as unavailable, when the member state is saturated or down", async () => {
		const stub = answering(saturated);
		expect(await failureOf(stub)).toContain("ViesUnavailableError");
		expect(stub.bodies).toHaveLength(3);
		expect(
			await failureOf(
				answering({
					actionSucceed: false,
					errorWrappers: [{ error: "MS_UNAVAILABLE" }],
				}),
			),
		).toContain("ViesUnavailableError");
	});

	it("fails as unavailable on a 5xx, a maintenance page or a dropped connection", async () => {
		expect(
			await failureOf(
				answering(
					{
						actionSucceed: false,
						errorWrappers: [{ error: "VOW-ERR-1", message: "retry later" }],
					},
					500,
				),
			),
		).toContain("ViesUnavailableError");
		expect(
			await failureOf(answering("<html>maintenance</html>", 503)),
		).toContain("ViesUnavailableError");
		const dropped = answeringFetch(() => {
			throw new TypeError("fetch failed");
		});
		expect(await failureOf(dropped)).toContain("VIES request failed");
		expect(dropped.bodies).toHaveLength(3);
	});

	it("fails as rejected input, without retrying, when VIES refuses the number itself", async () => {
		const stub = answering(malformed, 400);
		const cause = await failureOf(stub);
		expect(cause).toContain("ViesRejectedInputError");
		expect(cause).toContain("VOW-ERR-2600");
		expect(stub.bodies).toHaveLength(1);
	});
});
