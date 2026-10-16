import { describe, expect, it } from "bun:test";
import { DateTime, Effect } from "effect";
import { makeInMemoryLiveBus } from "../bus/in-memory-live-bus.ts";
import { LivePublisher } from "../bus/live-publisher.ts";
import type { LiveMatcher } from "../channel/live-channel.ts";
import { LiveChannelName } from "../message/live-channel-name.ts";
import type { LivePublication } from "../message/live-message.ts";
import { LIVE_BATCH_MILLISECONDS, LiveSocketHub } from "./live-socket-hub.ts";

const board = LiveChannelName.make("board");
const other = LiveChannelName.make("console.orders");

function publication(
	subjectId: string,
	region = "35",
	channel = board,
): LivePublication {
	return {
		channel,
		subjectType: "order",
		subjectId,
		kind: "order.placed",
		at: DateTime.makeUnsafe("2026-10-14T09:30:00Z"),
		attributes: { region },
	};
}

/** A clock the test turns by hand: each flush waits until `tick`. */
function manualSchedule() {
	const due: Array<{ readonly flush: () => void; readonly delay: number }> = [];
	return {
		schedule: (flush: () => void, delay: number) => {
			due.push({ flush, delay });
		},
		delays: () => due.map((entry) => entry.delay),
		tick: () => {
			for (const entry of due.splice(0)) {
				entry.flush();
			}
		},
	};
}

function recordingSocket() {
	const frames: Array<
		ReadonlyArray<{ readonly subjectId: string; readonly seq: string }>
	> = [];
	return {
		frames,
		socket: {
			send: (data: string) => {
				frames.push(JSON.parse(data).messages);
			},
		},
		subjects: () => frames.flat().map((message) => message.subjectId),
	};
}

function everything(): boolean {
	return true;
}

function inRegion(region: string): LiveMatcher {
	return (message) => message.attributes.region === region;
}

function setUp() {
	const clock = manualSchedule();
	const hub = new LiveSocketHub({ schedule: clock.schedule });
	const bus = makeInMemoryLiveBus(hub);
	function publish(...publications: ReadonlyArray<LivePublication>) {
		Effect.runSync(
			Effect.forEach(publications, (one) =>
				Effect.flatMap(LivePublisher, (publisher) => publisher.publish(one)),
			).pipe(Effect.provide(bus.layer)),
		);
	}
	return { clock, hub, log: bus.log, publish };
}

describe("LiveSocketHub", () => {
	it("sends a burst as one frame after the batch delay", () => {
		const { clock, hub, publish } = setUp();
		const page = recordingSocket();
		hub.add(board, page.socket, everything);
		publish(publication("o-1"), publication("o-2"), publication("o-3"));
		expect(page.frames).toEqual([]);
		expect(clock.delays()).toEqual([LIVE_BATCH_MILLISECONDS]);
		clock.tick();
		expect(page.frames.length).toBe(1);
		expect(page.subjects()).toEqual(["o-1", "o-2", "o-3"]);
	});

	it("keeps to the socket's channel and filter", () => {
		const { clock, hub, publish } = setUp();
		const brittany = recordingSocket();
		const everywhere = recordingSocket();
		hub.add(board, brittany.socket, inRegion("35"));
		hub.add(board, everywhere.socket, everything);
		publish(
			publication("o-1", "35"),
			publication("o-2", "75"),
			publication("o-3", "35", other),
		);
		clock.tick();
		expect(brittany.subjects()).toEqual(["o-1"]);
		expect(everywhere.subjects()).toEqual(["o-1", "o-2"]);
	});

	it("follows a new filter from the next message", () => {
		const { clock, hub, publish } = setUp();
		const page = recordingSocket();
		hub.add(board, page.socket, inRegion("35"));
		publish(publication("o-1", "75"));
		hub.refilter(page.socket, inRegion("75"));
		publish(publication("o-2", "75"));
		clock.tick();
		expect(page.subjects()).toEqual(["o-2"]);
	});

	it("sends nothing to a socket that left before the flush", () => {
		const { clock, hub, publish } = setUp();
		const page = recordingSocket();
		hub.add(board, page.socket, everything);
		publish(publication("o-1"));
		hub.remove(page.socket);
		clock.tick();
		expect(page.frames).toEqual([]);
	});

	it("waits the batch delay it was given", () => {
		const clock = manualSchedule();
		const hub = new LiveSocketHub({
			schedule: clock.schedule,
			batchMilliseconds: 40,
		});
		hub.add(board, recordingSocket().socket, everything);
		hub.deliver({ ...publication("o-1"), seq: "1" });
		expect(clock.delays()).toEqual([40]);
	});

	it("moves a socket added again to its new channel", () => {
		const { clock, hub, publish } = setUp();
		const page = recordingSocket();
		hub.add(board, page.socket, everything);
		hub.add(other, page.socket, everything);
		publish(publication("o-1"), publication("o-2", "35", other));
		clock.tick();
		expect(page.subjects()).toEqual(["o-2"]);
	});

	it("goes on when one socket throws", () => {
		const { clock, hub, publish } = setUp();
		const page = recordingSocket();
		hub.add(
			board,
			{
				send: () => {
					throw new Error("closing");
				},
			},
			everything,
		);
		hub.add(board, page.socket, everything);
		publish(publication("o-1"));
		clock.tick();
		expect(page.subjects()).toEqual(["o-1"]);
	});
});

describe("the in-memory live bus", () => {
	it("delivers 1,000 messages in order across a reconnect", () => {
		const { clock, hub, log, publish } = setUp();
		const ids = Array.from({ length: 1000 }, (_, index) => `o-${index}`);
		const first = recordingSocket();
		hub.add(board, first.socket, everything);
		publish(...ids.slice(0, 400).map((id) => publication(id)));
		clock.tick();
		hub.remove(first.socket);
		const lastRead = first.frames.flat().at(-1)?.seq ?? "0";

		publish(...ids.slice(400, 700).map((id) => publication(id)));

		const second = recordingSocket();
		hub.add(board, second.socket, everything);
		hub.sendNow(second.socket, Effect.runSync(log.since(board, lastRead)));
		publish(...ids.slice(700).map((id) => publication(id)));
		clock.tick();

		expect([...first.subjects(), ...second.subjects()]).toEqual(ids);
	});

	it("numbers each channel on its own", () => {
		const { log, publish } = setUp();
		publish(publication("o-1"), publication("o-2", "35", other));
		expect(
			[board, other].map((channel) =>
				Effect.runSync(log.since(channel, "0")).map((message) => message.seq),
			),
		).toEqual([["1"], ["1"]]);
	});
});
