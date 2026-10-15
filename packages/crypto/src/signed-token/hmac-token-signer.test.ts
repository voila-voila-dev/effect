import { describe, expect, it } from "bun:test";
import { Config, ConfigProvider, Effect, Exit } from "effect";
import { hexFromBytes } from "../bytes/hex.ts";
import { utf8Bytes } from "../bytes/utf8.ts";
import { hmacTokenSigner, makeHmacTokenSigner } from "./hmac-token-signer.ts";
import { TEST_SECRET } from "./test-signer.test-helper.ts";
import { TokenSigner } from "./token-signer.ts";

function tagOf(secret: string | Uint8Array<ArrayBuffer>, content: string) {
	return Effect.runPromise(
		Effect.flatMap(makeHmacTokenSigner(secret), (signer) =>
			signer.sign(content),
		).pipe(Effect.map(hexFromBytes)),
	);
}

describe("makeHmacTokenSigner", () => {
	it("is HMAC-SHA256 of the content", async () => {
		// RFC 4231 test case 2's key is too short for a token secret, so the
		// reference value comes from Web Crypto directly.
		const key = await crypto.subtle.importKey(
			"raw",
			utf8Bytes(TEST_SECRET),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);
		const expected = hexFromBytes(
			await crypto.subtle.sign("HMAC", key, utf8Bytes("content")),
		);

		expect(await tagOf(TEST_SECRET, "content")).toBe(expected);
	});

	it("reads a string secret as its UTF-8 bytes", async () => {
		expect(await tagOf(TEST_SECRET, "content")).toBe(
			await tagOf(utf8Bytes(TEST_SECRET), "content"),
		);
	});

	it("tags differently under another secret", async () => {
		expect(await tagOf(TEST_SECRET, "content")).not.toBe(
			await tagOf(`${TEST_SECRET}!`, "content"),
		);
	});

	it("refuses a secret under 32 bytes", async () => {
		const exit = await Effect.runPromiseExit(makeHmacTokenSigner("short"));
		expect(Exit.isFailure(exit)).toBe(true);
	});
});

describe("hmacTokenSigner", () => {
	function build(environment: Record<string, string>) {
		return Effect.runPromiseExit(
			TokenSigner.use((signer) => signer.sign("content")).pipe(
				Effect.provide(hmacTokenSigner(Config.Redacted("TOKEN_SECRET"))),
				Effect.provide(
					ConfigProvider.layer(ConfigProvider.fromEnvRecord(environment)),
				),
			),
		);
	}

	it("reads its secret from configuration", async () => {
		expect(Exit.isSuccess(await build({ TOKEN_SECRET: TEST_SECRET }))).toBe(
			true,
		);
	});

	it("fails to build without a secret, rather than falling back to one", async () => {
		expect(Exit.isFailure(await build({}))).toBe(true);
	});
});
