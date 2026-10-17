import { Option, Schema } from "effect";
import { LiveFrame, type LiveMessage } from "../message/live-message.ts";

/** The part of a browser `WebSocket` the connection uses, so a test hands it a fake. */
export interface LiveWebSocket {
	onopen: (() => void) | null;
	onmessage: ((event: { readonly data: unknown }) => void) | null;
	onclose: (() => void) | null;
	send: (data: string) => void;
	close: () => void;
}

export interface LiveTimers {
	readonly setTimeout: (run: () => void, milliseconds: number) => unknown;
	readonly clearTimeout: (handle: unknown) => void;
	readonly setInterval: (run: () => void, milliseconds: number) => unknown;
	readonly clearInterval: (handle: unknown) => void;
	readonly random: () => number;
}

export interface LiveConnectionOptions {
	/**
	 * The socket's URL, asked again before every connection, so it can carry a
	 * fresh single-use ticket. A rejection counts as a failed attempt. The
	 * connection adds `since` when it resumes.
	 */
	readonly socketUrl: () => Promise<string | URL>;
	readonly onMessages: (messages: ReadonlyArray<LiveMessage>) => void;
	/** Defaults to the global `WebSocket`. */
	readonly openSocket?: (url: string) => LiveWebSocket;
	/** Defaults to the global timers and `Math.random`. */
	readonly timers?: LiveTimers;
}

/** Under the 60 s a load balancer or a proxy lets a quiet socket idle. */
export const LIVE_PING_MILLISECONDS = 25_000;
const FIRST_RETRY_MILLISECONDS = 1000;
const LAST_RETRY_MILLISECONDS = 15_000;
/** As many as the server replays: a seq older than the window cannot come back. */
const REMEMBERED_SEQS = 1000;

const decodeFrame = Schema.decodeUnknownOption(
	Schema.fromJsonString(LiveFrame),
);

/** 1 s, 2 s, 4 s… up to 15 s, each ±20 %, so a fleet of pages that lost the server does not return at once. */
export function retryDelay(attempt: number, random: () => number): number {
	const delay = Math.min(
		FIRST_RETRY_MILLISECONDS * 2 ** attempt,
		LAST_RETRY_MILLISECONDS,
	);
	return Math.round(delay * (0.8 + random() * 0.4));
}

const globalTimers: LiveTimers = {
	setTimeout: (run, milliseconds) => globalThis.setTimeout(run, milliseconds),
	clearTimeout: (handle) =>
		globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
	setInterval: (run, milliseconds) => globalThis.setInterval(run, milliseconds),
	clearInterval: (handle) =>
		globalThis.clearInterval(handle as ReturnType<typeof setInterval>),
	random: Math.random,
};

/** Wraps the global `WebSocket`, whose handlers take richer events than the connection reads. */
export function openWebSocket(url: string): LiveWebSocket {
	const socket = new WebSocket(url);
	const live: LiveWebSocket = {
		onopen: null,
		onmessage: null,
		onclose: null,
		send: (data) => socket.send(data),
		close: () => socket.close(),
	};
	socket.onopen = () => live.onopen?.();
	socket.onmessage = (event) => live.onmessage?.({ data: event.data });
	socket.onclose = () => live.onclose?.();
	return live;
}

/**
 * One page's subscription to one channel. It opens the socket, pings it, and
 * on every drop reconnects with what it last read, so the server replays the
 * gap. A message read twice (the replay overlaps the live frames) reaches
 * `onMessages` once.
 */
export class LiveConnection {
	private socket: LiveWebSocket | undefined;
	/** A socket still connecting throws on `send`. */
	private isOpen = false;
	private ping: unknown;
	private retry: unknown;
	private attempt = 0;
	private stopped = false;
	private lastSeq: string | undefined;
	private filter: unknown;
	private readonly seen = new Set<string>();
	private readonly timers: LiveTimers;
	private readonly openSocket: (url: string) => LiveWebSocket;

	constructor(private readonly options: LiveConnectionOptions) {
		this.timers = options.timers ?? globalTimers;
		this.openSocket = options.openSocket ?? openWebSocket;
	}

	start(): void {
		this.stopped = false;
		void this.connect();
	}

	/** What the page looks at now; sent at once, and again on each reconnect. */
	setFilter(filter: unknown): void {
		this.filter = filter;
		this.sendFilter();
	}

	stop(): void {
		this.stopped = true;
		this.timers.clearTimeout(this.retry);
		this.timers.clearInterval(this.ping);
		const socket = this.socket;
		this.socket = undefined;
		this.isOpen = false;
		socket?.close();
	}

	private async connect(): Promise<void> {
		const url = await this.options.socketUrl().then(
			(found) => new URL(found),
			() => undefined,
		);
		if (this.stopped) {
			return;
		}
		if (url === undefined) {
			this.scheduleRetry();
			return;
		}
		if (this.lastSeq !== undefined) {
			url.searchParams.set("since", this.lastSeq);
		}
		const socket = this.openSocket(url.toString());
		this.socket = socket;
		socket.onopen = () => this.opened();
		socket.onmessage = (event) => this.received(event.data);
		socket.onclose = () => this.dropped(socket);
	}

	private opened(): void {
		this.isOpen = true;
		this.attempt = 0;
		this.sendFilter();
		this.ping = this.timers.setInterval(
			() => this.socket?.send("ping"),
			LIVE_PING_MILLISECONDS,
		);
	}

	private received(data: unknown): void {
		const fresh = Option.match(decodeFrame(data), {
			onNone: () => [],
			onSome: (frame) =>
				frame.messages.filter((message) => this.remember(message)),
		});
		if (fresh.length > 0) {
			this.options.onMessages(fresh);
		}
	}

	private remember(message: LiveMessage): boolean {
		if (this.seen.has(message.seq)) {
			return false;
		}
		this.seen.add(message.seq);
		if (this.seen.size > REMEMBERED_SEQS) {
			this.seen.delete(this.seen.values().next().value ?? "");
		}
		this.lastSeq = message.seq;
		return true;
	}

	private dropped(socket: LiveWebSocket): void {
		if (this.socket !== socket) {
			return;
		}
		this.isOpen = false;
		this.socket = undefined;
		this.timers.clearInterval(this.ping);
		if (!this.stopped) {
			this.scheduleRetry();
		}
	}

	private scheduleRetry(): void {
		this.retry = this.timers.setTimeout(
			() => void this.connect(),
			retryDelay(this.attempt, this.timers.random),
		);
		this.attempt += 1;
	}

	private sendFilter(): void {
		if (this.isOpen && this.filter !== undefined) {
			this.socket?.send(JSON.stringify({ filter: this.filter }));
		}
	}
}
