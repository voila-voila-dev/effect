import { Context, type Duration, type Effect } from "effect";
import type { OutboxStoreError } from "./outbox-store-error.ts";

/** An event as the store keeps it: already encoded, so the store never needs its schema. */
export interface NewOutboxMessage {
	readonly id: string;
	/** Several buses share one table; a worker claims from its own channel only. */
	readonly channel: string;
	readonly tag: string;
	/** JSON-compatible: what the channel's schema encoded. */
	readonly payload: unknown;
}

export interface OutboxMessage extends NewOutboxMessage {
	/** Counts this delivery: the first claim of a message reads 1. */
	readonly attempts: number;
	readonly createdAt: Date;
}

export interface ClaimOptions {
	readonly channel: string;
	readonly limit: number;
	/**
	 * How long a claimed message stays invisible to other workers. A worker
	 * that dies mid-batch holds nothing past it; one slower than it shares the
	 * message with another, which at-least-once delivery already allows.
	 */
	readonly lease: Duration.Duration;
}

export interface OutboxStoreShape {
	/** Joins the caller's transaction when the implementation has one. */
	readonly append: (
		messages: ReadonlyArray<NewOutboxMessage>,
	) => Effect.Effect<void, OutboxStoreError>;
	/** Counts the attempt at claim time, so a message that crashes its worker still reaches the cap. */
	readonly claim: (
		options: ClaimOptions,
	) => Effect.Effect<ReadonlyArray<OutboxMessage>, OutboxStoreError>;
	readonly complete: (
		ids: ReadonlyArray<string>,
	) => Effect.Effect<void, OutboxStoreError>;
	readonly retry: (
		id: string,
		options: { readonly after: Duration.Duration; readonly error: string },
	) => Effect.Effect<void, OutboxStoreError>;
	/** Out of every claim for good; an operator reads `error` and decides. */
	readonly park: (
		id: string,
		options: { readonly error: string },
	) => Effect.Effect<void, OutboxStoreError>;
	/**
	 * Delivered messages created before the cutoff; a parked one stays until
	 * someone looks at it. Returns how many went.
	 */
	readonly prune: (options: {
		readonly olderThan: Duration.Duration;
	}) => Effect.Effect<number, OutboxStoreError>;
}

export class OutboxStore extends Context.Service<
	OutboxStore,
	OutboxStoreShape
>()("@voila.dev/outbox/OutboxStore") {}
