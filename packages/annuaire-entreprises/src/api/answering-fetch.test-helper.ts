import type { Fetch } from "@voila.dev/http";

export interface AnsweringFetch {
	readonly fetch: Fetch;
	readonly urls: Array<URL>;
}

/** A `fetch` that answers each call with what `answer` returns: a `Response`, or a value sent as JSON with a 200. It records the URLs asked for. */
export function answeringFetch(
	answer: (attempt: number) => unknown,
): AnsweringFetch {
	const urls: Array<URL> = [];
	return {
		urls,
		fetch: async (input) => {
			urls.push(new URL(String(input)));
			const answered = answer(urls.length);
			return answered instanceof Response
				? answered
				: Response.json(answered, { status: 200 });
		},
	};
}
