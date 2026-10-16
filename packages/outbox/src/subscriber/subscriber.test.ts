import { describe, expect, it } from "bun:test";
import { unitRuns } from "@voila.dev/effect-ddd";
import { Effect, Metric } from "effect";
import { OrderPlaced } from "../event-bus/order-events.test-helper.ts";
import { Subscriber } from "./subscriber.ts";

function runsOf(name: string, outcome: string): number {
	const counter = Metric.withAttributes(unitRuns, {
		kind: "subscriber",
		name,
		outcome,
	});
	return Effect.runSync(Metric.value(counter)).count as number;
}

const event = new OrderPlaced({ orderId: "o-1", total: 3 });
const metadata = { id: "m-1", attempts: 1 };

describe("Subscriber.make", () => {
	it("accepts one tag or several", () => {
		const one = Subscriber.make({
			name: "one",
			tag: "OrderPlaced",
			run: (_: OrderPlaced) => Effect.void,
		});
		const several = Subscriber.make({
			name: "several",
			tag: ["OrderPlaced"],
			run: (_: OrderPlaced) => Effect.void,
		});
		expect([one.tags, several.tags]).toEqual([
			["OrderPlaced"],
			["OrderPlaced"],
		]);
	});

	it("reports each run as a subscriber unit", async () => {
		const ok = Subscriber.make({
			name: "subscriber-metrics-ok",
			tag: "OrderPlaced",
			run: (_: OrderPlaced) => Effect.succeed("ignored"),
		});
		const broken = Subscriber.make({
			name: "subscriber-metrics-failed",
			tag: "OrderPlaced",
			run: (_: OrderPlaced) => Effect.fail("boom"),
		});
		await Effect.runPromise(ok.run(event, metadata));
		await Effect.runPromise(Effect.ignore(broken.run(event, metadata)));

		expect(runsOf("subscriber-metrics-ok", "ok")).toBe(1);
		expect(runsOf("subscriber-metrics-failed", "failed")).toBe(1);
	});
});
