import { describe, expect, it } from "bun:test";
import { EmailAddress, type EmailMessage } from "@voila.dev/email";
import { sendPlan } from "./send-plan.ts";

function message(subject: string, withAttachment = false): EmailMessage {
	return {
		from: "hello@example.com",
		to: [EmailAddress.make("marie@example.fr")],
		subject,
		text: subject,
		...(withAttachment && {
			attachments: [
				{
					filename: "a.pdf",
					content: new Uint8Array([1]),
					contentType: "application/pdf",
				},
			],
		}),
	};
}

function shape(messages: ReadonlyArray<EmailMessage>) {
	return sendPlan(messages).map((step) =>
		step.kind === "single"
			? step.message.subject
			: step.messages.map((each) => each.subject),
	);
}

describe("sendPlan", () => {
	it("sends a message with attachments alone, keeping the order", () => {
		expect(
			shape([message("a"), message("b"), message("c", true), message("d")]),
		).toEqual([["a", "b"], "c", ["d"]]);
	});

	it("splits a long run into batches of 100", () => {
		const plan = sendPlan(
			Array.from({ length: 250 }, (_, index) => message(String(index))),
		);
		expect(
			plan.map((step) => (step.kind === "batch" ? step.messages.length : 1)),
		).toEqual([100, 100, 50]);
	});

	it("plans nothing for nothing", () => {
		expect(sendPlan([])).toEqual([]);
	});
});
