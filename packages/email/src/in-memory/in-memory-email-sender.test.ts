import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { EmailAddress } from "../message/email-address.ts";
import type { EmailMessage } from "../message/email-message.ts";
import { EmailSender } from "../sender/email-sender.ts";
import { inMemoryEmailSender } from "./in-memory-email-sender.ts";

function to(address: string): EmailMessage {
	return {
		from: "hello@example.com",
		to: [EmailAddress.make(address)],
		subject: "Bonjour",
		text: "Bonjour",
	};
}

describe("inMemoryEmailSender", () => {
	it("keeps each message with the id it answered", async () => {
		const sender = inMemoryEmailSender();
		const ids = await Effect.runPromise(
			Effect.gen(function* () {
				const email = yield* EmailSender;
				const first = yield* email.send(to("marie@example.fr"));
				const rest = yield* email.sendMany([
					to("paul@example.fr"),
					to("lea@example.fr"),
				]);
				return [first, ...rest];
			}).pipe(Effect.provide(sender.layer)),
		);
		expect(ids).toEqual(["email-1", "email-2", "email-3"]);
		expect(sender.sent.map(({ message }) => String(message.to[0]))).toEqual([
			"marie@example.fr",
			"paul@example.fr",
			"lea@example.fr",
		]);
	});

	it("refuses a failing recipient and keeps nothing for it", async () => {
		const sender = inMemoryEmailSender();
		sender.failingRecipients.add("marie@example.fr");
		const error = await Effect.runPromise(
			Effect.flip(sender.service.send(to("marie@example.fr"))),
		);
		expect(error._tag).toBe("EmailSendError");
		expect(sender.sent).toHaveLength(0);
	});
});
