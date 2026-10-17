import { describe, expect, it } from "bun:test";
import { EmailAddress, type EmailMessage } from "@voila.dev/email";
import { OutboundFetch, retryPolicy } from "@voila.dev/http";
import { Effect, Redacted } from "effect";
import { recordingFetch } from "../recording-fetch.test-helper.ts";
import { makeResendEmailSender } from "./make-resend-email-sender.ts";

const sender = makeResendEmailSender({
	apiKey: Redacted.make("re_test"),
	rateLimitedRetry: retryPolicy({
		attempts: 4,
		initialDelay: "1 millis",
		maximumDelay: "1 millis",
	}),
});

function message(overrides: Partial<EmailMessage> = {}): EmailMessage {
	return {
		from: "Example <hello@example.com>",
		to: [EmailAddress.make("marie@example.fr")],
		subject: "Bonjour",
		text: "Bonjour",
		html: "<p>Bonjour</p>",
		...overrides,
	};
}

/** Answers like Resend: an id per message, `{ data: [...] }` for a batch. */
function resend() {
	return recordingFetch((call, index) =>
		Array.isArray(call.body)
			? { data: call.body.map((_, each) => ({ id: `batch-${index}-${each}` })) }
			: { id: `email-${index}` },
	);
}

function run<A, E>(
	stub: ReturnType<typeof recordingFetch>,
	effect: Effect.Effect<A, E>,
) {
	return Effect.runPromise(
		effect.pipe(Effect.provideService(OutboundFetch, () => stub.fetch)),
	);
}

describe("send", () => {
	it("posts the message to /emails under the key, and answers Resend's id", async () => {
		const stub = resend();
		const id = await run(
			stub,
			sender.send(
				message({
					cc: [EmailAddress.make("paul@example.fr")],
					replyTo: [EmailAddress.make("thread.42@reply.example.com")],
					headers: { "List-Unsubscribe": "<https://example.com/u>" },
					attachments: [
						{
							filename: "facture.pdf",
							content: new TextEncoder().encode("%PDF"),
							contentType: "application/pdf",
						},
					],
				}),
			),
		);
		expect(id).toBe("email-0");
		expect(stub.calls[0]?.url).toBe("https://api.resend.com/emails");
		expect(stub.calls[0]?.headers.get("authorization")).toBe("Bearer re_test");
		expect(stub.calls[0]?.body).toEqual({
			from: "Example <hello@example.com>",
			to: ["marie@example.fr"],
			cc: ["paul@example.fr"],
			reply_to: ["thread.42@reply.example.com"],
			subject: "Bonjour",
			text: "Bonjour",
			html: "<p>Bonjour</p>",
			headers: { "List-Unsubscribe": "<https://example.com/u>" },
			attachments: [
				{
					filename: "facture.pdf",
					content: "JVBERg==",
					content_type: "application/pdf",
				},
			],
		});
	});

	it("leaves out what the message does not set", async () => {
		const stub = resend();
		await run(stub, sender.send(message({ html: undefined })));
		expect(Object.keys(stub.calls[0]?.body ?? {}).sort()).toEqual([
			"from",
			"subject",
			"text",
			"to",
		]);
	});

	// A burst past Resend's rate limit once surfaced every 429 as a failed
	// delivery: Resend did not take the message, so it must be retried.
	it("retries a 429 with backoff", async () => {
		const stub = recordingFetch((_, index) =>
			index < 2
				? Response.json({ name: "rate_limit_exceeded" }, { status: 429 })
				: { id: "email-late" },
		);
		expect(await run(stub, sender.send(message()))).toBe("email-late");
		expect(stub.calls).toHaveLength(3);
	});

	it("does not retry a 5xx, which may have sent the message", async () => {
		const stub = recordingFetch(() =>
			Response.json({ name: "internal_server_error" }, { status: 500 }),
		);
		const error = await run(stub, Effect.flip(sender.send(message())));
		expect(error._tag).toBe("EmailSendError");
		expect(error.message).toContain("Resend 500");
		expect(stub.calls).toHaveLength(1);
	});

	it("fails on a refusal with what Resend said", async () => {
		const stub = recordingFetch(() =>
			Response.json(
				{ name: "validation_error", message: "domain not verified" },
				{ status: 403 },
			),
		);
		const error = await run(stub, Effect.flip(sender.send(message())));
		expect(error.message).toContain("403");
		expect(error.message).toContain("domain not verified");
	});
});

describe("sendMany", () => {
	it("sends a batch in one call, and one with attachments on its own, ids in order", async () => {
		const stub = resend();
		const withAttachment = message({
			subject: "pièce jointe",
			attachments: [
				{
					filename: "a.txt",
					content: new Uint8Array([97]),
					contentType: "text/plain",
				},
			],
		});
		const ids = await run(
			stub,
			sender.sendMany([message(), message(), withAttachment, message()]),
		);
		expect(stub.calls.map((call) => new URL(call.url).pathname)).toEqual([
			"/emails/batch",
			"/emails",
			"/emails/batch",
		]);
		expect(ids).toEqual(["batch-0-0", "batch-0-1", "email-1", "batch-2-0"]);
	});

	it("makes no call for no messages", async () => {
		const stub = resend();
		expect(await run(stub, sender.sendMany([]))).toEqual([]);
		expect(stub.calls).toHaveLength(0);
	});
});
