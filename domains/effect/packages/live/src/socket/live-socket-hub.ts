import { Schema } from "effect";
import type { LiveMatcher } from "../channel/live-channel.ts";
import { LiveMessage } from "../message/live-message.ts";

/** Anything that takes a text frame: a Bun `ServerWebSocket` or a `ws` socket fits, so the hub names no server. */
export interface LiveSocket {
	readonly send: (data: string) => void;
}

/** Long enough to group a burst into one frame, short enough to read as instant. */
export const LIVE_BATCH_MILLISECONDS = 250;

const encodeMessage = Schema.encodeSync(LiveMessage);

/** A message as its JSON text: serialized once, whatever the number of sockets it reaches. */
function serialize(message: LiveMessage): string {
	return JSON.stringify(encodeMessage(message));
}

export interface LiveSocketHubOptions {
	/** How long a message waits for others of its socket. Defaults to {@link LIVE_BATCH_MILLISECONDS}. */
	readonly batchMilliseconds?: number;
	/** Runs a flush later. Defaults to `setTimeout`; a test turns it by hand. */
	readonly schedule?: (flush: () => void, milliseconds: number) => void;
}

interface Subscription {
	readonly channel: string;
	matcher: LiveMatcher;
	pending: Array<string>;
	flushScheduled: boolean;
}

/**
 * The open sockets of one process, per channel, each with the filter its page
 * sent. A delivered message waits at most the batch delay (250 ms) and
 * leaves with the others of its socket in one `{ messages }` frame.
 */
export class LiveSocketHub {
	private readonly subscriptions = new Map<LiveSocket, Subscription>();
	private readonly byChannel = new Map<string, Set<LiveSocket>>();
	private readonly batchMilliseconds: number;
	private readonly schedule: (flush: () => void, milliseconds: number) => void;

	constructor(options: LiveSocketHubOptions = {}) {
		this.batchMilliseconds =
			options.batchMilliseconds ?? LIVE_BATCH_MILLISECONDS;
		this.schedule =
			options.schedule ??
			((flush, milliseconds) => {
				setTimeout(flush, milliseconds);
			});
	}

	/** A socket listens to one channel: adding it again moves it. */
	add(channel: string, socket: LiveSocket, matcher: LiveMatcher): void {
		this.remove(socket);
		this.subscriptions.set(socket, {
			channel,
			matcher,
			pending: [],
			flushScheduled: false,
		});
		const sockets = this.byChannel.get(channel) ?? new Set<LiveSocket>();
		sockets.add(socket);
		this.byChannel.set(channel, sockets);
	}

	/** The page changed what it looks at: later messages follow the new filter. */
	refilter(socket: LiveSocket, matcher: LiveMatcher): void {
		const subscription = this.subscriptions.get(socket);
		if (subscription !== undefined) {
			subscription.matcher = matcher;
		}
	}

	remove(socket: LiveSocket): void {
		const subscription = this.subscriptions.get(socket);
		if (subscription === undefined) {
			return;
		}
		this.subscriptions.delete(socket);
		const sockets = this.byChannel.get(subscription.channel);
		sockets?.delete(socket);
		if (sockets?.size === 0) {
			this.byChannel.delete(subscription.channel);
		}
	}

	deliver(message: LiveMessage): void {
		const sockets = this.byChannel.get(message.channel);
		if (sockets === undefined) {
			return;
		}
		let serialized: string | undefined;
		for (const socket of sockets) {
			const subscription = this.subscriptions.get(socket);
			if (subscription?.matcher(message) === true) {
				serialized ??= serialize(message);
				this.enqueue(socket, subscription, serialized);
			}
		}
	}

	/** Sends a replay at once, ahead of the batch: the page asked for it on connect. */
	sendNow(socket: LiveSocket, messages: ReadonlyArray<LiveMessage>): void {
		if (messages.length > 0) {
			send(socket, messages.map(serialize));
		}
	}

	private enqueue(
		socket: LiveSocket,
		subscription: Subscription,
		serialized: string,
	): void {
		subscription.pending.push(serialized);
		if (subscription.flushScheduled) {
			return;
		}
		subscription.flushScheduled = true;
		this.schedule(() => {
			subscription.flushScheduled = false;
			const batch = subscription.pending;
			subscription.pending = [];
			if (this.subscriptions.get(socket) === subscription) {
				send(socket, batch);
			}
		}, this.batchMilliseconds);
	}
}

/** A `LiveFrame`, assembled from messages already serialized. */
function send(socket: LiveSocket, messages: ReadonlyArray<string>): void {
	try {
		socket.send(`{"messages":[${messages.join(",")}]}`);
	} catch {
		// A socket can be closing between the lookup and the send; the next
		// frame finds it gone. One dead socket never fails the others.
	}
}
