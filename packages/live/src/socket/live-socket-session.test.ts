import { describe, expect, it } from "bun:test";
import { Gate } from "@voila.dev/effect-ddd";
import { DateTime, Effect, Schema } from "effect";
import { makeInMemoryLiveBus } from "../bus/in-memory-live-bus.ts";
import { LivePublisher } from "../bus/live-publisher.ts";
import { defineLiveChannel } from "../channel/live-channel.ts";
import { LiveChannelName } from "../message/live-channel-name.ts";
import type { LivePublication } from "../message/live-message.ts";
import { LiveSocketHub } from "./live-socket-hub.ts";
import { openLiveSocket, receiveLiveFrame } from "./live-socket-session.ts";

const board = defineLiveChannel({
	name: LiveChannelName.make("board"),
	gate: Gate.anyone(),
	filter: Schema.Struct({ regions: Schema.Array(Schema.String) }),
	matches: (filter, message) =>
		filter.regions.includes(message.attributes.region ?? ""),
});

function publication(subjectId: string, region: string): LivePublication {
	return {
		channel: board.name,
		subjectType: "order",
		subjectId,
		kind: "order.placed",
		at: DateTime.makeUnsafe("2026-10-14T09:30:00Z"),
		attributes: { region },
	};
}

function setUp() {
	const flushes: Array<() => void> = [];
	const hub = new LiveSocketHub((flush) => {
		flushes.push(flush);
	});
	const bus = makeInMemoryLiveBus(hub);
	const frames: Array<ReadonlyArray<{ readonly subjectId: string }>> = [];
	const socket = {
		send: (data: string) => frames.push(JSON.parse(data).messages),
	};
	return {
		hub,
		log: bus.log,
		socket,
		received: () =>
			frames.map((frame) => frame.map((message) => message.subjectId)),
		publish: (...publications: ReadonlyArray<LivePublication>) =>
			Effect.runSync(
				Effect.forEach(publications, (one) =>
					Effect.flatMap(LivePublisher, (publisher) => publisher.publish(one)),
				).pipe(Effect.provide(bus.layer)),
			),
		flush: () => {
			for (const flush of flushes.splice(0)) {
				flush();
			}
		},
	};
}

describe("a live socket", () => {
	it("opens on everything its channel publishes", () => {
		const page = setUp();
		openLiveSocket({ ...page, channel: board, missed: [] });
		page.publish(publication("o-1", "35"), publication("o-2", "75"));
		page.flush();
		expect(page.received()).toEqual([["o-1", "o-2"]]);
	});

	it("first sends what it missed after `since`, in one frame", () => {
		const page = setUp();
		page.publish(
			publication("o-1", "35"),
			publication("o-2", "35"),
			publication("o-3", "35"),
		);
		openLiveSocket({
			...page,
			channel: board,
			missed: Effect.runSync(page.log.since(board.name, "1")),
		});
		page.publish(publication("o-4", "35"));
		page.flush();
		expect(page.received()).toEqual([["o-2", "o-3"], ["o-4"]]);
	});

	it("looks through the filter the page sends", () => {
		const page = setUp();
		openLiveSocket({ ...page, channel: board, missed: [] });
		receiveLiveFrame({
			...page,
			channel: board,
			frame: '{"filter":{"regions":["35"]}}',
		});
		page.publish(publication("o-1", "35"), publication("o-2", "75"));
		page.flush();
		expect(page.received()).toEqual([["o-1"]]);
	});

	it("keeps its filter on a frame it cannot read", () => {
		const page = setUp();
		openLiveSocket({ ...page, channel: board, missed: [] });
		receiveLiveFrame({
			...page,
			channel: board,
			frame: '{"filter":{"regions":["35"]}}',
		});
		for (const frame of ["ping", "{}", '{"filter":{"regions":"75"}}']) {
			receiveLiveFrame({ ...page, channel: board, frame });
		}
		page.publish(publication("o-1", "35"), publication("o-2", "75"));
		page.flush();
		expect(page.received()).toEqual([["o-1"]]);
	});
});
