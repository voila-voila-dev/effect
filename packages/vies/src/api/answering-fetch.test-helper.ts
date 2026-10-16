import type { Fetch } from "@voila.dev/http";

export interface AnsweringFetch {
	readonly fetch: Fetch;
	/** The JSON body of each call, in order. */
	readonly bodies: Array<unknown>;
}

/** A `fetch` that answers each call with what `answer` returns: a `Response`, or a value sent as JSON with a 200. */
export function answeringFetch(
	answer: (attempt: number) => unknown,
): AnsweringFetch {
	const bodies: Array<unknown> = [];
	return {
		bodies,
		fetch: async (_input, init) => {
			bodies.push(
				typeof init?.body === "string" ? JSON.parse(init.body) : init?.body,
			);
			const answered = answer(bodies.length);
			return answered instanceof Response
				? answered
				: Response.json(answered, { status: 200 });
		},
	};
}
