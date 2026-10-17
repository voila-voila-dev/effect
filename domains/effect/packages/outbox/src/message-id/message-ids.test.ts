import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { MessageIds, uuidV7 } from "./message-ids.ts";

const UUID_V7 =
	/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

describe("uuidV7", () => {
	it("is a version 7, variant 1 UUID", () => {
		expect(uuidV7(Date.UTC(2026, 0, 1))).toMatch(UUID_V7);
	});

	it("sorts by the time it was drawn at", () => {
		const earlier = uuidV7(Date.UTC(2026, 0, 1));
		const later = uuidV7(Date.UTC(2026, 0, 1, 0, 0, 0, 1));
		expect(earlier < later).toBe(true);
		expect(earlier.slice(0, 13)).toBe("019b76da-a800");
	});
});

describe("MessageIds", () => {
	it("draws UUIDv7s without being provided", async () => {
		const id = await Effect.runPromise(
			Effect.flatMap(MessageIds, (ids) => ids.next),
		);
		expect(id).toMatch(UUID_V7);
	});
});
