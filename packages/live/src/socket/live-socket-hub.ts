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

interface Subscription {
	readonly channel: string;
	matcher: LiveMatcher;
	pending: Array<unknown>;
	flushScheduled: boolean;
}

/**
 * The open sockets of one process, per channel, each with the filter its page
 * sent. A delivered message waits at most {@link LIVE_BATCH_MILLISECONDS} and
 * leaves with the others of its socket in one `{ messages }` frame.
 */
export class LiveSocketHub {
	private readonly subscriptions = new Map<LiveSocket, Subscription>();
	private readonly byChannel = new Map<string, Set<LiveSocket>>();

	constructor(
		private readonly schedule: (
			flush: () => void,
			milliseconds: number,
		) => void = (flush, milliseconds) => {
			setTimeout(flush, milliseconds);
		},
	) {}

	add(channel: string, socket: LiveSocket, matcher: LiveMatcher): void {
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
		const encoded = encodeMessage(message);
		for (const socket of sockets) {
			const subscription = this.subscriptions.get(socket);
			if (subscription?.matcher(message) === true) {
				this.enqueue(socket, subscription, encoded);
			}
		}
	}

	/** Sends a replay at once, ahead of the batch: the page asked for it on connect. */
	sendNow(socket: LiveSocket, messages: ReadonlyArray<LiveMessage>): void {
		if (messages.length > 0) {
			send(
				socket,
				messages.map((message) => encodeMessage(message)),
			);
		}
	}

	private enqueue(
		socket: LiveSocket,
		subscription: Subscription,
		encoded: unknown,
	): void {
		subscription.pending.push(encoded);
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
		}, LIVE_BATCH_MILLISECONDS);
	}
}

function send(socket: LiveSocket, messages: ReadonlyArray<unknown>): void {
	try {
		socket.send(JSON.stringify({ messages }));
	} catch {
		// A socket can be closing between the lookup and the send; the next
		// frame finds it gone. One dead socket never fails the others.
	}
}
