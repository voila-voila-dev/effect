import { describe, expect, it } from "bun:test";
import { Option } from "effect";
import { decodeResendWebhookEvent } from "./resend-webhook-event.ts";

describe("decodeResendWebhookEvent", () => {
	it("reads a bounce", () => {
		const event = decodeResendWebhookEvent({
			type: "email.bounced",
			created_at: "2026-10-16T09:00:00.000Z",
			data: {
				email_id: "em_1",
				to: ["marie@example.fr"],
				bounce: { type: "Permanent", message: "mailbox does not exist" },
				unknown_field: true,
			},
		});
		expect(Option.map(event, ({ data }) => data?.bounce?.type)).toEqual(
			Option.some("Permanent"),
		);
	});

	it("reads an event kind it does not know, and refuses what is not an event", () => {
		expect(
			Option.isSome(decodeResendWebhookEvent({ type: "domain.updated" })),
		).toBe(true);
		expect(Option.isNone(decodeResendWebhookEvent({ data: {} }))).toBe(true);
	});
});
