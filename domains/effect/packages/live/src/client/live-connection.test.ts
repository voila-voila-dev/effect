import { describe, expect, it } from "bun:test";
import { DateTime, Schema } from "effect";
import { LiveChannelName } from "../message/live-channel-name.ts";
import { LiveMessage } from "../message/live-message.ts";
import {
	LIVE_PING_MILLISECONDS,
	LiveConnection,
	type LiveWebSocket,
	retryDelay,
} from "./live-connection.ts";

const encodeMessage = Schema.encodeSync(LiveMessage);

function frame(...seqs: ReadonlyArray<string>): string {
	return JSON.stringify({
		messages: seqs.map((seq) =>
			encodeMessage({
				channel: LiveChannelName.make("board"),
				subjectType: "order",
				subjectId: `o-${seq}`,
				kind: "order.placed",
				at: DateTime.makeUnsafe("2026-10-14T09:30:00Z"),
				attributes: {},
				seq,
			}),
		),
	});
}

class FakeSocket implements LiveWebSocket {
	onopen: (() => void) | null = null;
	onmessage: ((event: { readonly data: unknown }) => void) | null = null;
	onclose: (() => void) | null = null;
	readonly sent: Array<string> = [];
	closed = false;
	constructor(readonly url: string) {}
	send(data: string) {
		this.sent.push(data);
	}
	close() {
		this.closed = true;
		this.onclose?.();
	}
}

/** Timers the test runs by hand, in order of creation. */
function manualTimers() {
	let next = 0;
	const timeouts = new Map<number, { run: () => void; delay: number }>();
	const intervals = new Map<number, { run: () => void; every: number }>();
	return {
		timeouts,
		intervals,
		timers: {
			setTimeout: (run: () => void, delay: number) => {
				timeouts.set(++next, { run, delay });
				return next;
			},
			clearTimeout: (handle: unknown) => timeouts.delete(Number(handle)),
			setInterval: (run: () => void, every: number) => {
				intervals.set(++next, { run, every });
				return next;
			},
			clearInterval: (handle: unknown) => intervals.delete(Number(handle)),
			random: () => 0.5,
		},
		runTimeouts: () => {
			const due = [...timeouts.values()];
			timeouts.clear();
			for (const timeout of due) {
				timeout.run();
			}
		},
	};
}

function setUp(options?: { readonly failTickets?: number }) {
	const clock = manualTimers();
	const sockets: Array<FakeSocket> = [];
	const delivered: Array<ReadonlyArray<string>> = [];
	let ticketsToFail = options?.failTickets ?? 0;
	let tickets = 0;
	const connection = new LiveConnection({
		socketUrl: () => {
			tickets += 1;
			if (ticketsToFail > 0) {
				ticketsToFail -= 1;
				return Promise.reject(new Error("401"));
			}
			return Promise.resolve(
				`ws://api/live/board/stream?ticket=ticket-${tickets}`,
			);
		},
		openSocket: (url) => {
			const socket = new FakeSocket(url);
			sockets.push(socket);
			return socket;
		},
		onMessages: (messages) =>
			delivered.push(messages.map((message) => message.seq)),
		timers: clock.timers,
	});
	return { connection, clock, sockets, delivered };
}

function settle() {
	return Bun.sleep(0);
}

describe("LiveConnection", () => {
	it("opens with a fresh ticket and hands over each frame", async () => {
		const { connection, sockets, delivered } = setUp();
		connection.start();
		await settle();
		sockets[0]?.onopen?.();
		sockets[0]?.onmessage?.({ data: frame("1", "2") });
		expect(sockets[0]?.url).toBe("ws://api/live/board/stream?ticket=ticket-1");
		expect(delivered).toEqual([["1", "2"]]);
	});

	it("reconnects after a drop, asking for what came after the last seq", async () => {
		const { connection, clock, sockets, delivered } = setUp();
		connection.start();
		await settle();
		sockets[0]?.onopen?.();
		sockets[0]?.onmessage?.({ data: frame("1", "2") });
		sockets[0]?.onclose?.();
		clock.runTimeouts();
		await settle();
		sockets[1]?.onopen?.();
		sockets[1]?.onmessage?.({ data: frame("2", "3") });
		expect(sockets[1]?.url).toBe(
			"ws://api/live/board/stream?ticket=ticket-2&since=2",
		);
		expect(delivered).toEqual([["1", "2"], ["3"]]);
	});

	it("sends its filter once open, and again after a reconnect", async () => {
		const { connection, clock, sockets } = setUp();
		connection.setFilter({ regions: ["35"] });
		connection.start();
		await settle();
		expect(sockets[0]?.sent).toEqual([]);
		sockets[0]?.onopen?.();
		connection.setFilter({ regions: ["29"] });
		sockets[0]?.onclose?.();
		clock.runTimeouts();
		await settle();
		sockets[1]?.onopen?.();
		expect([sockets[0]?.sent, sockets[1]?.sent]).toEqual([
			['{"filter":{"regions":["35"]}}', '{"filter":{"regions":["29"]}}'],
			['{"filter":{"regions":["29"]}}'],
		]);
	});

	it("pings an open socket", async () => {
		const { connection, clock, sockets } = setUp();
		connection.start();
		await settle();
		sockets[0]?.onopen?.();
		const [ping] = [...clock.intervals.values()];
		ping?.run();
		expect([ping?.every, sockets[0]?.sent]).toEqual([
			LIVE_PING_MILLISECONDS,
			["ping"],
		]);
	});

	it("backs off while the ticket is refused", async () => {
		const { connection, clock, sockets } = setUp({ failTickets: 3 });
		connection.start();
		const delays: Array<number> = [];
		for (let attempt = 0; attempt < 3; attempt++) {
			await settle();
			delays.push(
				...[...clock.timeouts.values()].map((timeout) => timeout.delay),
			);
			clock.runTimeouts();
		}
		await settle();
		expect([delays, sockets.length]).toEqual([[1000, 2000, 4000], 1]);
	});

	it("stays closed once stopped", async () => {
		const { connection, clock, sockets } = setUp();
		connection.start();
		await settle();
		sockets[0]?.onopen?.();
		connection.stop();
		expect([
			sockets[0]?.closed,
			clock.timeouts.size,
			clock.intervals.size,
		]).toEqual([true, 0, 0]);
	});
});

describe("retryDelay", () => {
	it("doubles up to 15 s, within 20 % either way", () => {
		expect(
			[0, 1, 2, 3, 4, 5].map((attempt) => retryDelay(attempt, () => 0.5)),
		).toEqual([1000, 2000, 4000, 8000, 15_000, 15_000]);
		expect([retryDelay(0, () => 0), retryDelay(0, () => 1)]).toEqual([
			800, 1200,
		]);
	});
});
