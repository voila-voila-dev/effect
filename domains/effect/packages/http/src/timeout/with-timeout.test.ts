import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { OutboundTimeoutError } from "./outbound-timeout-error.ts";
import { withTimeout } from "./with-timeout.ts";

describe("withTimeout", () => {
	it("lets a call that answers in time through", async () => {
		expect(
			await Effect.runPromise(
				Effect.succeed("ok").pipe(withTimeout("1 second")),
			),
		).toBe("ok");
	});

	it("fails a stalled call with the deadline it missed, interrupting it", async () => {
		let interrupted = false;
		const stalled = Effect.never.pipe(
			Effect.onInterrupt(() =>
				Effect.sync(() => {
					interrupted = true;
				}),
			),
		);

		const error = await Effect.runPromise(
			Effect.flip(stalled.pipe(withTimeout("10 millis"))),
		);

		expect(error).toEqual(
			new OutboundTimeoutError({ timeoutMilliseconds: 10 }),
		);
		expect(interrupted).toBe(true);
	});
});
