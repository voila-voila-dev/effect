import { describe, expect, it } from "bun:test";
import { OutboundFetch } from "@voila.dev/http";
import { Effect, Redacted } from "effect";
import { recordingFetch } from "../recording-fetch.test-helper.ts";
import { makeResendReceiving } from "./make-resend-receiving.ts";

const receiving = makeResendReceiving({
	apiKey: Redacted.make("re_test"),
	maxAttachmentBytes: 8,
});

function run<A, E>(
	stub: ReturnType<typeof recordingFetch>,
	effect: Effect.Effect<A, E>,
) {
	return Effect.runPromise(
		effect.pipe(Effect.provideService(OutboundFetch, () => stub.fetch)),
	);
}

describe("getEmail", () => {
	it("reads the body, the verdicts wherever they sit, and lowercases header names", async () => {
		const stub = recordingFetch(() => ({
			text: "Bonjour",
			html: null,
			spf: "pass",
			authentication: { dkim: { status: "FAIL" }, dmarc: "none" },
			headers: { "Message-ID": "<a@b>", "X-Count": 3 },
		}));
		const email = await run(stub, receiving.getEmail("rcv_1"));
		expect(stub.calls[0]?.url).toBe(
			"https://api.resend.com/emails/receiving/rcv_1",
		);
		expect(stub.calls[0]?.headers.get("authorization")).toBe("Bearer re_test");
		expect(email).toEqual({
			text: "Bonjour",
			html: null,
			spf: "Pass",
			dkim: "Fail",
			dmarc: "Unknown",
			headers: { "message-id": "<a@b>" },
		});
	});

	it("fails as ResendReceivingError on a refusal", async () => {
		const stub = recordingFetch(() =>
			Response.json({ name: "not_found" }, { status: 404 }),
		);
		const error = await run(stub, Effect.flip(receiving.getEmail("rcv_1")));
		expect(error._tag).toBe("ResendReceivingError");
		expect(error.message).toContain("404");
	});
});

describe("getAttachment", () => {
	it("follows the signed URL without the key", async () => {
		const stub = recordingFetch((call) =>
			call.url.startsWith("https://api.resend.com/")
				? {
						download_url: "https://files.resend.test/signed",
						content_type: "text/plain",
					}
				: new Response("hello"),
		);
		const attachment = await run(
			stub,
			receiving.getAttachment("rcv_1", "att_1"),
		);
		expect(stub.calls.map((call) => call.url)).toEqual([
			"https://api.resend.com/emails/receiving/rcv_1/attachments/att_1",
			"https://files.resend.test/signed",
		]);
		expect(stub.calls[1]?.headers.get("authorization")).toBeNull();
		expect(new TextDecoder().decode(attachment.bytes)).toBe("hello");
		expect(attachment.contentType).toBe("text/plain");
	});

	it("refuses an attachment larger than the bound, and one with no URL", async () => {
		const large = recordingFetch((call) =>
			call.url.startsWith("https://api.resend.com/")
				? { download_url: "https://files.resend.test/signed" }
				: new Response("more than eight bytes"),
		);
		expect(
			(await run(large, Effect.flip(receiving.getAttachment("rcv_1", "att_1"))))
				.message,
		).toContain("attachment fetch failed");
		const missing = recordingFetch(() => ({ content_type: "text/plain" }));
		expect(
			(
				await run(
					missing,
					Effect.flip(receiving.getAttachment("rcv_1", "att_1")),
				)
			).message,
		).toContain("no download_url");
	});
});
