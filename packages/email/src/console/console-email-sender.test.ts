import { describe, expect, it } from "bun:test";
import { Effect, Logger } from "effect";
import { EmailAddress } from "../message/email-address.ts";
import { consoleEmailSender } from "./console-email-sender.ts";

describe("consoleEmailSender", () => {
	it("logs the message with its text instead of sending it", async () => {
		const lines: Array<unknown> = [];
		const logger = Logger.make(({ message }) => {
			lines.push(message);
		});
		const id = await Effect.runPromise(
			consoleEmailSender()
				.send({
					from: "hello@example.com",
					to: [EmailAddress.make("marie@example.fr")],
					subject: "Your code",
					text: "123456",
				})
				.pipe(Effect.provide(Logger.layer([logger]))),
		);
		expect(id).toBe("console-1");
		expect(JSON.stringify(lines)).toContain(
			"hello@example.com → marie@example.fr: Your code",
		);
		expect(JSON.stringify(lines)).toContain("123456");
	});
});
