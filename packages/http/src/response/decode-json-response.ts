import { Effect, Schema } from "effect";
import { readBoundedBytes } from "./read-bounded-bytes.ts";
import { ResponseDecodeError } from "./response-decode-error.ts";
import { ResponseTooLargeError } from "./response-too-large-error.ts";

/** Far above any JSON answer a partner API sends, and still a bound: a runaway body cannot exhaust the heap. */
export const DEFAULT_MAX_RESPONSE_BYTES = 10 * 1024 * 1024;

const decoder = new TextDecoder();

/**
 * Reads a response's JSON body, at most `maxBytes` of it, through `schema`.
 * The partner's answer is `unknown` until the schema has read it, so a
 * changed shape is a typed failure here rather than a wrong value downstream.
 */
export function decodeJsonResponse<S extends Schema.Top>(
	schema: S,
	options: { readonly maxBytes?: number } = {},
) {
	const maxBytes = options.maxBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
	const decode = Schema.decodeUnknownEffect(schema);
	return (
		response: Response,
	): Effect.Effect<
		S["Type"],
		ResponseTooLargeError | ResponseDecodeError,
		S["DecodingServices"]
	> =>
		Effect.gen(function* () {
			const bytes = yield* Effect.tryPromise({
				try: () => readBoundedBytes(response, maxBytes),
				catch: (cause) => new ResponseDecodeError({ cause }),
			});
			if (bytes === null) {
				return yield* Effect.fail(new ResponseTooLargeError({ maxBytes }));
			}
			const body = yield* Effect.try({
				try: (): unknown => JSON.parse(decoder.decode(bytes)),
				catch: (cause) => new ResponseDecodeError({ cause }),
			});
			return yield* decode(body).pipe(
				Effect.mapError((cause) => new ResponseDecodeError({ cause })),
			);
		});
}
