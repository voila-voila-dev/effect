import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { OutboundStatusError } from "../response/outbound-status-error.ts";
import { retryOutbound } from "./retry-outbound.ts";
import { quickPolicy } from "./retry-test-policy.test-helper.ts";
import { isRateLimited } from "./retryable.ts";

/** Fails with each status in turn, then succeeds. */
function answering(statuses: ReadonlyArray<number>) {
	let runs = 0;
	const effect = Effect.suspend(() => {
		const status = statuses[runs];
		runs += 1;
		return status === undefined
			? Effect.succeed("ok")
			: Effect.fail(new OutboundStatusError({ status, body: "" }));
	});
	return { effect, runs: () => runs };
}

describe("retryOutbound", () => {
	it("retries a transient failure until it succeeds", async () => {
		const call = answering([503, 502]);

		expect(
			await Effect.runPromise(call.effect.pipe(retryOutbound(quickPolicy(2)))),
		).toBe("ok");
		expect(call.runs()).toBe(3);
	});

	it("gives up after its attempts with the last failure", async () => {
		const call = answering([503, 503, 500]);

		const error = await Effect.runPromise(
			Effect.flip(call.effect.pipe(retryOutbound(quickPolicy(1)))),
		);

		expect(error.status).toBe(503);
		expect(call.runs()).toBe(2);
	});

	it("never retries a refusal", async () => {
		const call = answering([404]);

		await Effect.runPromiseExit(
			call.effect.pipe(retryOutbound(quickPolicy(3))),
		);

		expect(call.runs()).toBe(1);
	});

	it("composes: one policy for blips, another for rate limits", async () => {
		const call = answering([429, 503, 429]);

		const result = await Effect.runPromise(
			call.effect.pipe(
				retryOutbound(quickPolicy(2)),
				retryOutbound(quickPolicy(2), { when: isRateLimited }),
			),
		);

		expect(result).toBe("ok");
		expect(call.runs()).toBe(4);
	});
});
