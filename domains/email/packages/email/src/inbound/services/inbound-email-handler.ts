import { Context, type Effect } from "effect";
import type { InboundEmail } from "../aggregates/inbound-email.ts";

/**
 * What the application made of a reply: routed somewhere (with an opaque
 * `reference` to it), unroutable, or rejected. Never `received`: the handler
 * always decides.
 */
export interface InboundRoutingOutcome {
	readonly status: "routed" | "unroutable" | "rejected";
	readonly reference: string | null;
}

/**
 * Where a reply's meaning lives. Routing proves the reply address was one we
 * minted and hands its opaque `payload` to this handler, which the
 * application implements: it knows what the payload names, checks that the
 * sender is who it should be and that the message passed DMARC, and takes the
 * message in. Every business miss is an outcome, never an error.
 */
export class InboundEmailHandler extends Context.Service<
	InboundEmailHandler,
	{
		readonly handle: (input: {
			readonly inbound: InboundEmail;
			readonly payload: string;
		}) => Effect.Effect<InboundRoutingOutcome>;
	}
>()("@voila.dev/email/InboundEmailHandler") {}
