import { describe, expect, it } from "bun:test";
import { DateTime, Effect, Exit, Layer, Schema } from "effect";
import { TestClock } from "effect/testing";
import { base64UrlFromBytes } from "../bytes/base64.ts";
import { utf8Bytes } from "../bytes/utf8.ts";
import { SignedToken } from "./signed-token.ts";
import { signerWith } from "./test-signer.test-helper.ts";
import type { TokenSigner } from "./token-signer.ts";

const Unsubscribe = SignedToken.make({
	purpose: "newsletter.unsubscribe",
	payload: Schema.Struct({ contactId: Schema.String }),
});

const Download = SignedToken.make({
	purpose: "file.download",
	payload: Schema.Struct({ key: Schema.String, until: Schema.DateTimeUtc }),
	lifetime: "1 hour",
});

const START = DateTime.makeUnsafe("2026-01-01T00:00:00Z");

function run<A, E>(
	effect: Effect.Effect<A, E, TokenSigner>,
	signer: Layer.Layer<TokenSigner> = Layer.orDie(signerWith()),
) {
	return Effect.runPromiseExit(
		Effect.gen(function* () {
			yield* TestClock.setTime(DateTime.toEpochMillis(START));
			return yield* effect;
		}).pipe(Effect.provide(signer), Effect.provide(TestClock.layer())),
	);
}

function reason(reason: string) {
	return Exit.fail(expect.objectContaining({ reason }));
}

describe("SignedToken", () => {
	it("verifies to the payload it was issued with", async () => {
		expect(
			await run(
				Effect.flatMap(Unsubscribe.issue({ contactId: "c-1" }), (token) =>
					Unsubscribe.verify(token),
				),
			),
		).toStrictEqual(Exit.succeed({ contactId: "c-1" }));
	});

	it("issues a URL-safe token in two parts when it never expires", async () => {
		const exit = await run(Unsubscribe.issue({ contactId: "c-1" }));
		const token = Exit.isSuccess(exit) ? exit.value : "";

		expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$/u);
	});

	it("encodes a payload through its schema", async () => {
		const until = DateTime.makeUnsafe("2026-02-01T00:00:00Z");
		const exit = await run(
			Effect.flatMap(Download.issue({ key: "a/b.pdf", until }), (token) =>
				Download.verify(token),
			),
		);

		expect(exit).toStrictEqual(Exit.succeed({ key: "a/b.pdf", until }));
	});

	it("expires after the kind's lifetime", async () => {
		const exit = await run(
			Effect.gen(function* () {
				const token = yield* Download.issue({ key: "k", until: START });
				yield* TestClock.adjust("59 minutes");
				yield* Download.verify(token);
				yield* TestClock.adjust("1 minute");
				return yield* Download.verify(token);
			}),
		);

		expect(exit).toEqual(reason("expired"));
	});

	it("expires at the date given to issueUntil", async () => {
		const exit = await run(
			Effect.gen(function* () {
				const token = yield* Unsubscribe.issueUntil(
					{ contactId: "c-1" },
					DateTime.add(START, { days: 1 }),
				);
				yield* TestClock.adjust("2 days");
				return yield* Unsubscribe.verify(token);
			}),
		);

		expect(exit).toEqual(reason("expired"));
	});

	it("refuses a token with its payload edited", async () => {
		const exit = await run(
			Effect.gen(function* () {
				const token = yield* Unsubscribe.issue({ contactId: "c-1" });
				const edited = base64UrlFromBytes(
					utf8Bytes(JSON.stringify({ contactId: "c-2" })),
				);
				return yield* Unsubscribe.verify(
					`${edited}.${token.split(".").at(-1)}`,
				);
			}),
		);

		expect(exit).toEqual(reason("forged"));
	});

	it("refuses a token with its expiry pushed back", async () => {
		const exit = await run(
			Effect.gen(function* () {
				const token = yield* Download.issue({ key: "k", until: START });
				const [payload, expiry = "", tag] = token.split(".");
				const later = (Number.parseInt(expiry, 36) + 3600).toString(36);
				return yield* Download.verify(`${payload}.${later}.${tag}`);
			}),
		);

		expect(exit).toEqual(reason("forged"));
	});

	it("refuses a token of another purpose with the same payload", async () => {
		const Other = SignedToken.make({
			purpose: "newsletter.confirm",
			payload: Schema.Struct({ contactId: Schema.String }),
		});
		const exit = await run(
			Effect.flatMap(Other.issue({ contactId: "c-1" }), (token) =>
				Unsubscribe.verify(token),
			),
		);

		expect(exit).toEqual(reason("forged"));
	});

	it("refuses a token signed under another secret", async () => {
		const token = await run(Unsubscribe.issue({ contactId: "c-1" }));
		const exit = await run(
			Unsubscribe.verify(Exit.isSuccess(token) ? token.value : ""),
			Layer.orDie(signerWith("another secret of at least thirty-two bytes")),
		);

		expect(exit).toEqual(reason("forged"));
	});

	it("refuses text that is not a token as malformed", async () => {
		for (const token of ["", "abc", ".tag", "a..tag", "a.b.c.d", "a.B!.tag"]) {
			expect(await run(Unsubscribe.verify(token))).toEqual(reason("malformed"));
		}
	});

	it("refuses a genuine token whose payload no longer decodes", async () => {
		const Before = SignedToken.make({
			purpose: "newsletter.unsubscribe",
			payload: Schema.Struct({ email: Schema.String }),
		});
		const exit = await run(
			Effect.flatMap(Before.issue({ email: "a@example.com" }), (token) =>
				Unsubscribe.verify(token),
			),
		);

		expect(exit).toEqual(reason("malformed"));
	});

	it("names the purpose in the error", async () => {
		expect(await run(Unsubscribe.verify("abc"))).toEqual(
			Exit.fail(expect.objectContaining({ purpose: "newsletter.unsubscribe" })),
		);
	});

	it("shortens the tag to the bytes asked for", async () => {
		const Reply = SignedToken.make({
			purpose: "mail.reply",
			payload: Schema.String,
			tagBytes: 8,
		});
		const exit = await run(
			Effect.flatMap(Reply.issue("thread-1"), (token) =>
				Effect.map(Reply.verify(token), (payload) => ({ token, payload })),
			),
		);
		const value = Exit.isSuccess(exit) ? exit.value : undefined;

		expect(value?.payload).toBe("thread-1");
		expect(value?.token.split(".").at(-1)).toHaveLength(11);
	});

	it("refuses a purpose over several lines and a tag out of range", () => {
		const payload = Schema.String;
		expect(() => SignedToken.make({ purpose: "", payload })).toThrow();
		expect(() => SignedToken.make({ purpose: "a\nb", payload })).toThrow();
		expect(() =>
			SignedToken.make({ purpose: "a", payload, tagBytes: 4 }),
		).toThrow();
	});
});
