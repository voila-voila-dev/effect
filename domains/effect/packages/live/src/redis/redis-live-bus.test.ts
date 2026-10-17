import { describe, expect, it } from "bun:test";
import { DateTime } from "effect";
import { LiveChannelName } from "../message/live-channel-name.ts";
import type { LivePublication } from "../message/live-message.ts";
import {
	liveStreamKey,
	messagesOfEntries,
	messagesOfRead,
	xaddArguments,
} from "./redis-live-bus.ts";

const booked: LivePublication = {
	channel: LiveChannelName.make("board"),
	subjectType: "order",
	subjectId: "o-1",
	kind: "order.placed",
	at: DateTime.makeUnsafe("2026-10-14T09:30:00.000Z"),
	attributes: { region: "35" },
};

const key = liveStreamKey("board", { prefix: "3f2a9c:live:" });
const field = xaddArguments(key, booked).at(-1) ?? "";

describe("the Redis live log's wire format", () => {
	it("appends to the channel's capped stream", () => {
		expect(xaddArguments(key, booked).slice(0, 6)).toEqual([
			"3f2a9c:live:board",
			"MAXLEN",
			"~",
			"1000",
			"*",
			"m",
		]);
	});

	it("keys a channel's stream under `live:` by default", () => {
		expect(liveStreamKey("board")).toBe("live:board");
	});

	it("reads a range back as messages numbered by their stream id", () => {
		expect(messagesOfEntries([["1792012161898-0", ["m", field]]])).toEqual([
			{ ...booked, seq: "1792012161898-0" },
		]);
	});

	it("reads a blocking read per stream", () => {
		expect(
			messagesOfRead({
				[key]: [
					["1-0", ["m", field]],
					["1-1", ["m", field]],
				],
			}),
		).toEqual([
			[
				key,
				[
					{ ...booked, seq: "1-0" },
					{ ...booked, seq: "1-1" },
				],
			],
		]);
	});

	it("reads nothing from a read that timed out", () => {
		expect(messagesOfRead(null)).toEqual([]);
	});

	it("drops an entry that holds no publication", () => {
		expect(
			messagesOfEntries([
				["1-0", ["m", "{not json"]],
				["1-1", ["other", field]],
				["1-2", ["m", field]],
			]).map((message) => message.seq),
		).toEqual(["1-2"]);
	});
});
