import { describe, expect, it } from "bun:test";
import { makeHmacTokenSigner, TokenSigner } from "@voila.dev/crypto";
import { DateTime, Effect, Layer } from "effect";
import { TestClock } from "effect/testing";
import { localPartOf } from "../lib/threaded-message-ids.ts";
import { ReplyAddresses } from "../services/reply-addresses.ts";
import { signedReplyAddresses } from "./signed-reply-addresses.ts";

function addresses(secret = "s".repeat(32)) {
	return signedReplyAddresses({ domain: "reply.example.com" }).pipe(
		Layer.provide(
			Layer.orDie(Layer.effect(TokenSigner, makeHmacTokenSigner(secret))),
		),
	);
}

function run<A, E>(
	program: Effect.Effect<A, E, ReplyAddresses>,
	layer = addresses(),
) {
	return Effect.runPromise(
		program.pipe(Effect.provide(Layer.merge(layer, TestClock.layer()))),
	);
}

const inADay = DateTime.makeUnsafe(86_400_000);

function mint(payload: string) {
	return Effect.flatMap(ReplyAddresses, (replyAddresses) =>
		replyAddresses.mint({ payload, expiresAt: inADay }),
	);
}

function verify(address: string) {
	return Effect.flatMap(ReplyAddresses, (replyAddresses) =>
		replyAddresses.verify(localPartOf(address) ?? ""),
	).pipe(Effect.result);
}

describe("signedReplyAddresses", () => {
	it("mints an address on the reply domain that verifies back to its payload", async () => {
		const result = await run(
			Effect.gen(function* () {
				const address = yield* mint("conv_42");
				return { address, verified: yield* verify(address) };
			}),
		);
		expect(result.address).toMatch(/^r\.[^@]{1,62}@reply\.example\.com$/u);
		expect(result.verified).toMatchObject({
			_tag: "Success",
			success: "conv_42",
		});
	});

	it("refuses an altered, a foreign or an expired address", async () => {
		const results = await run(
			Effect.gen(function* () {
				const address = yield* mint("conv_42");
				const altered = address.replace("r.", "r.x");
				const foreign = yield* mint("conv_42").pipe(
					Effect.provide(addresses("t".repeat(32))),
				);
				const now = yield* Effect.all([
					verify(altered),
					verify(foreign),
					verify("hello@reply.example.com"),
				]);
				yield* TestClock.adjust("2 days");
				return [...now, yield* verify(address)];
			}),
		);
		expect(results.map((result) => result._tag)).toEqual([
			"Failure",
			"Failure",
			"Failure",
			"Failure",
		]);
	});
});
