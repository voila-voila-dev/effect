import { Effect } from "effect";
import { OutboundStatusError } from "./outbound-status-error.ts";

// An error page can be a whole HTML document: its start says what went wrong.
const EXCERPT_CHARACTERS = 1000;

/** The start of the body, the rest left unread; empty when the body cannot be read. */
async function excerpt(response: Response): Promise<string> {
	if (response.body === null) return "";
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let text = "";
	try {
		while (text.length < EXCERPT_CHARACTERS) {
			const { done, value } = await reader.read();
			if (done) break;
			text += decoder.decode(value, { stream: true });
		}
	} catch {
		return text.slice(0, EXCERPT_CHARACTERS);
	}
	await reader.cancel().catch(() => undefined);
	return text.slice(0, EXCERPT_CHARACTERS);
}

/**
 * The response when its status is 2xx; otherwise an {@link OutboundStatusError}
 * carrying the status and the start of the body. A non-2xx answer is a failure
 * an adapter must handle, not a value it can forget to check.
 */
export function ensureSuccess(
	response: Response,
): Effect.Effect<Response, OutboundStatusError> {
	if (response.ok) return Effect.succeed(response);
	return Effect.promise(() => excerpt(response)).pipe(
		Effect.flatMap((body) =>
			Effect.fail(new OutboundStatusError({ status: response.status, body })),
		),
	);
}
