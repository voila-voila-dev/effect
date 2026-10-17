import { Schema } from "effect";

/**
 * Why a message came back. A `Hard` bounce means the address does not exist
 * and must never be mailed again; a `Soft` one means a full mailbox or a busy
 * server, and the address may work tomorrow. `Blocked` says nothing about the
 * address and everything about the sender: the receiving server refused us,
 * so suppressing the recipient would treat our problem as theirs.
 */
export const BOUNCE_KINDS = ["Hard", "Soft", "Blocked"] as const;

export const BounceKind = Schema.Literals(BOUNCE_KINDS);

export type BounceKind = typeof BounceKind.Type;
