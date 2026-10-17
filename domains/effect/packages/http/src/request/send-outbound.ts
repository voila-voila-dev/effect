import { Effect } from "effect";
import { outboundFetch } from "../fetch/outbound-fetch.ts";
import { OutboundTransportError } from "./outbound-transport-error.ts";

function abortedBy(fiber: AbortSignal, init: RequestInit | undefined) {
	return init?.signal ? AbortSignal.any([fiber, init.signal]) : fiber;
}

/**
 * One request to `partner` through its {@link outboundFetch}. Any response is
 * a success here, a 500 included: `ensureSuccess` decides what a failure is.
 * Interrupting the effect (a timeout, a retry giving up) aborts the request,
 * so a stalled partner does not keep the socket.
 */
export function sendOutbound(
	partner: string,
	input: string | URL | Request,
	init?: RequestInit,
): Effect.Effect<Response, OutboundTransportError> {
	return Effect.flatMap(outboundFetch(partner), (fetch) =>
		Effect.tryPromise({
			try: (signal) =>
				fetch(input, { ...init, signal: abortedBy(signal, init) }),
			catch: (cause) => new OutboundTransportError({ partner, cause }),
		}),
	);
}
