import { describe, expect, it } from "bun:test";
import { Effect, Exit } from "effect";
import { fakeFetch } from "../fetch/fake-fetch.test-helper.ts";
import type { Fetch } from "../fetch/fetch.ts";
import { OutboundFetch } from "../fetch/outbound-fetch.ts";
import { OutboundTransportError } from "./outbound-transport-error.ts";
import { sendOutbound } from "./send-outbound.ts";

function through<A, E>(fetch: Fetch, effect: Effect.Effect<A, E>) {
	return effect.pipe(Effect.provideService(OutboundFetch, () => fetch));
}

describe("sendOutbound", () => {
	it("hands back any response, a 500 included", async () => {
		const partner = fakeFetch(() => new Response("down", { status: 500 }));

		const response = await Effect.runPromise(
			through(
				partner.fetch,
				sendOutbound("acme", "https://api.acme.test/v1", { method: "POST" }),
			),
		);

		expect(response.status).toBe(500);
		expect(partner.calls[0]?.init.method).toBe("POST");
	});

	it("turns a thrown fetch into a transport error naming the partner", async () => {
		const thrown = new TypeError("fetch failed");
		const partner = fakeFetch(() => {
			throw thrown;
		});

		const exit = await Effect.runPromiseExit(
			through(partner.fetch, sendOutbound("acme", "https://api.acme.test/")),
		);

		expect(exit).toStrictEqual(
			Exit.fail(new OutboundTransportError({ partner: "acme", cause: thrown })),
		);
	});

	it("aborts the request when the effect is interrupted", async () => {
		let signal: AbortSignal | undefined;
		const hanging: Fetch = (_input, init) => {
			signal = init?.signal ?? undefined;
			return new Promise(() => undefined);
		};

		await Effect.runPromise(
			through(
				hanging,
				sendOutbound("acme", "https://api.acme.test/").pipe(
					Effect.timeoutOption("10 millis"),
				),
			),
		);

		expect(signal?.aborted).toBe(true);
	});

	it("still honours the caller's own signal", async () => {
		const caller = new AbortController();
		let signal: AbortSignal | undefined;
		const partner: Fetch = async (_input, init) => {
			signal = init?.signal ?? undefined;
			return new Response("ok");
		};

		await Effect.runPromise(
			through(
				partner,
				sendOutbound("acme", "https://api.acme.test/", {
					signal: caller.signal,
				}),
			),
		);
		caller.abort();

		expect(signal?.aborted).toBe(true);
	});
});
