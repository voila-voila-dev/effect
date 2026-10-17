import { describe, expect, it } from "bun:test";
import { Config, ConfigProvider, Effect, Exit, Redacted } from "effect";
import { base64FromBytes, bytesFromBase64 } from "../bytes/base64.ts";
import { aesGcmSecretBox, makeAesGcmSecretBox } from "./aes-gcm-secret-box.ts";
import { SecretBox } from "./secret-box.ts";

const KEY = Uint8Array.from({ length: 32 }, (_, index) => index);

function box(key: Uint8Array<ArrayBuffer> = KEY) {
	return Effect.runPromise(makeAesGcmSecretBox(key));
}

describe("makeAesGcmSecretBox", () => {
	it("opens what it sealed", async () => {
		const secrets = await box();
		const sealed = await Effect.runPromise(
			secrets.seal("sk_live_1234", "secret-1"),
		);

		expect(sealed).toStartWith("v1.");
		expect(sealed).not.toContain("sk_live_1234");
		expect(await Effect.runPromise(secrets.open(sealed, "secret-1"))).toBe(
			"sk_live_1234",
		);
	});

	it("seals one value twice into two texts", async () => {
		const secrets = await box();

		const first = await Effect.runPromise(secrets.seal("same", "secret-1"));
		const second = await Effect.runPromise(secrets.seal("same", "secret-1"));

		expect(first).not.toBe(second);
	});

	it("refuses a text with one byte changed", async () => {
		const secrets = await box();
		const sealed = await Effect.runPromise(
			secrets.seal("sk_live_1234", "secret-1"),
		);
		const [format, nonce, ciphertext = ""] = sealed.split(".");
		const bytes = bytesFromBase64(ciphertext) ?? new Uint8Array();
		bytes[0] = (bytes[0] ?? 0) ^ 1;

		const exit = await Effect.runPromiseExit(
			secrets.open(`${format}.${nonce}.${base64FromBytes(bytes)}`, "secret-1"),
		);

		expect(exit).toEqual(
			Exit.fail(expect.objectContaining({ reason: "unreadable" })),
		);
	});

	it("refuses a text sealed under another key", async () => {
		const sealed = await Effect.runPromise(
			(await box()).seal("value", "secret-1"),
		);
		const other = await box(new Uint8Array(32).fill(7));

		const exit = await Effect.runPromiseExit(other.open(sealed, "secret-1"));

		expect(exit).toEqual(
			Exit.fail(expect.objectContaining({ reason: "unreadable" })),
		);
	});

	it("refuses a text sealed for another record", async () => {
		const secrets = await box();
		const sealed = await Effect.runPromise(secrets.seal("value", "secret-1"));

		const exit = await Effect.runPromiseExit(secrets.open(sealed, "secret-2"));

		expect(exit).toEqual(
			Exit.fail(expect.objectContaining({ reason: "unreadable" })),
		);
	});

	it("refuses a text that is not in its format", async () => {
		const secrets = await box();

		for (const sealed of ["", "v1", "v2.AAAA.AAAA", "v1.AAAA.AAAA", "v1.!.!"]) {
			const exit = await Effect.runPromiseExit(secrets.open(sealed, "x"));
			expect(exit).toEqual(
				Exit.fail(expect.objectContaining({ reason: "unreadable" })),
			);
		}
	});

	it("refuses a key that is not 32 bytes", async () => {
		const exit = await Effect.runPromiseExit(
			makeAesGcmSecretBox(new Uint8Array(16)),
		);

		expect(Exit.isFailure(exit)).toBe(true);
	});
});

describe("aesGcmSecretBox", () => {
	function run(environment: Record<string, string>) {
		return Effect.runPromiseExit(
			Effect.gen(function* () {
				const secrets = yield* SecretBox;
				return yield* secrets.open(yield* secrets.seal("value", "a"), "a");
			}).pipe(
				Effect.provide(aesGcmSecretBox(Config.Redacted("SECRET_BOX_KEY"))),
				Effect.provide(
					ConfigProvider.layer(ConfigProvider.fromEnvRecord(environment)),
				),
			),
		);
	}

	it("reads its key from configuration in base64", async () => {
		expect(await run({ SECRET_BOX_KEY: base64FromBytes(KEY) })).toStrictEqual(
			Exit.succeed("value"),
		);
	});

	it("fails to build without the key", async () => {
		expect(Exit.isFailure(await run({}))).toBe(true);
	});

	it("fails to build on a key that is not base64 or not 32 bytes", async () => {
		expect(Exit.isFailure(await run({ SECRET_BOX_KEY: "not base64!" }))).toBe(
			true,
		);
		expect(
			Exit.isFailure(
				await run({ SECRET_BOX_KEY: base64FromBytes(new Uint8Array(16)) }),
			),
		).toBe(true);
	});

	it("takes the key from any Config, not only the environment", async () => {
		const exit = await Effect.runPromiseExit(
			SecretBox.use((secrets) => secrets.seal("value", "a")).pipe(
				Effect.provide(
					aesGcmSecretBox(Config.succeed(Redacted.make(base64FromBytes(KEY)))),
				),
			),
		);

		expect(Exit.isSuccess(exit)).toBe(true);
	});
});
