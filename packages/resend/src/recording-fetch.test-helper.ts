import type { Fetch } from "@voila.dev/http";

export interface RecordedCall {
	readonly url: string;
	readonly headers: Headers;
	readonly body: unknown;
}

/** A `fetch` that answers each call with what `answer` returns (a `Response`, or a value sent as JSON with a 200) and records the calls. */
export function recordingFetch(
	answer: (call: RecordedCall, index: number) => unknown,
): { readonly fetch: Fetch; readonly calls: Array<RecordedCall> } {
	const calls: Array<RecordedCall> = [];
	return {
		calls,
		fetch: async (input, init) => {
			const call = {
				url: String(input),
				headers: new Headers(init?.headers),
				body:
					typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
			};
			calls.push(call);
			const answered = answer(call, calls.length - 1);
			return answered instanceof Response
				? answered
				: Response.json(answered, { status: 200 });
		},
	};
}
