import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { inMemoryResendReceiving } from "./in-memory-resend-receiving.ts";

describe("inMemoryResendReceiving", () => {
	it("answers what was seeded and fails on anything else", async () => {
		const receiving = inMemoryResendReceiving();
		receiving.seedEmail("rcv_1", {
			text: "Bonjour",
			html: null,
			spf: "Pass",
			dkim: "Pass",
			dmarc: "Pass",
			headers: {},
		});
		expect(
			(await Effect.runPromise(receiving.service.getEmail("rcv_1"))).text,
		).toBe("Bonjour");
		expect(
			(
				await Effect.runPromise(
					Effect.flip(receiving.service.getEmail("rcv_2")),
				)
			)._tag,
		).toBe("ResendReceivingError");
		expect(
			(
				await Effect.runPromise(
					Effect.flip(receiving.service.getAttachment("rcv_1", "att_1")),
				)
			)._tag,
		).toBe("ResendReceivingError");
	});
});
