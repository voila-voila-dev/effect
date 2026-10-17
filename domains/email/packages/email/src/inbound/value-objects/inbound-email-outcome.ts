import { Schema } from "effect";

/**
 * What routing decided a received message means.
 *
 * - `received`: stored, not routed yet. Every message starts here.
 * - `routed`: a reply address of ours, and the application took the message
 *   in (into a conversation, say); `routedReference` says where.
 * - `unroutable`: no valid reply address, or the application found no home
 *   for it. Nothing is lost, the body is kept: the operators' queue.
 * - `rejected`: understood and refused on purpose: an auto-reply, a reply to a
 *   closed thread, a sender who failed authentication.
 */
export const INBOUND_EMAIL_OUTCOMES = [
	"received",
	"routed",
	"unroutable",
	"rejected",
] as const;

export const InboundEmailOutcome = Schema.Literals(INBOUND_EMAIL_OUTCOMES);

export type InboundEmailOutcome = typeof InboundEmailOutcome.Type;
