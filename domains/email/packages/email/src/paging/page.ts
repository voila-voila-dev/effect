import { Schema } from "effect";

/** Which slice of a list to read: `limit` rows after the first `offset`. */
export const PageRequest = Schema.Struct({
	limit: Schema.Int.pipe(
		Schema.check(Schema.isBetween({ minimum: 1, maximum: 200 })),
	),
	offset: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
});

export type PageRequest = typeof PageRequest.Type;

/** One slice of a list, with how many rows the whole list holds. */
export interface Page<A> {
	readonly items: ReadonlyArray<A>;
	readonly total: number;
}

/** Slices an in-memory list the way a repository's `LIMIT … OFFSET` would. */
export function pageOf<A>(
	rows: ReadonlyArray<A>,
	request: PageRequest,
): Page<A> {
	return {
		items: rows.slice(request.offset, request.offset + request.limit),
		total: rows.length,
	};
}
