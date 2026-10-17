import { describe, expect, it } from "bun:test";
import { Schema } from "effect";
import { EmailMessage } from "./email-message.ts";

const decode = Schema.decodeUnknownSync(EmailMessage);

describe("EmailMessage", () => {
	it("takes a message with one recipient and nothing optional", () => {
		expect(
			decode({
				from: "Example <hello@example.com>",
				to: ["marie@example.fr"],
				subject: "Bonjour",
				text: "Bonjour",
			}).to.map(String),
		).toEqual(["marie@example.fr"]);
	});

	it("refuses a message to nobody, or to something that is not an address", () => {
		const base = { from: "hello@example.com", subject: "", text: "" };
		expect(() => decode({ ...base, to: [] })).toThrow();
		expect(() => decode({ ...base, to: ["marie"] })).toThrow();
		expect(() =>
			decode({ ...base, from: "", to: ["marie@example.fr"] }),
		).toThrow();
	});
});
