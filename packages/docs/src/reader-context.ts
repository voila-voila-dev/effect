/**
 * One fact about the reader that changes the answer, separate from the
 * language they read in: a closed list of values, asked only of the
 * audiences it concerns.
 */
export interface ReaderDimension<
	Value extends string = string,
	Audience extends string = string,
> {
	values: readonly [Value, ...Array<Value>];
	audiences: readonly [Audience, ...Array<Audience>];
	/** Sets the dimension from a link, so support can send a page in a reader's context. */
	queryParameter: string;
}

/** The dimensions a site declares, by name. */
export type ReaderDimensions<Audience extends string = string> = Readonly<
	Record<string, ReaderDimension<string, Audience>>
>;

/** What a reader said of themselves: a value per dimension they answered. */
export type ReaderContext = Readonly<Partial<Record<string, string>>>;

/** The values a page or a passage is written for, by dimension. A dimension left out is any value. */
export type Applicability = Readonly<
	Partial<Record<string, ReadonlyArray<string>>>
>;

/** A dimension the reader's context rules a page out on, with the values the page is written for. */
export interface ContextMismatch {
	dimension: string;
	values: ReadonlyArray<string>;
}

/** The dimensions an audience is asked, in the site's order. */
export function dimensionsFor(
	dimensions: ReaderDimensions,
	audience: string,
): Array<string> {
	return Object.entries(dimensions)
		.filter(([, dimension]) => dimension.audiences.includes(audience))
		.map(([name]) => name);
}

/**
 * Why a page does not apply to the reader, empty when it does. A dimension
 * the reader has not answered never rules a page out: nobody loses a page for
 * not saying where they work.
 */
export function contextMismatches(
	appliesTo: Applicability | undefined,
	context: ReaderContext,
): Array<ContextMismatch> {
	return Object.entries(appliesTo ?? {}).flatMap(([dimension, values]) => {
		const chosen = context[dimension];
		return values && chosen !== undefined && !values.includes(chosen)
			? [{ dimension, values }]
			: [];
	});
}

function isKnownValue(
	dimensions: ReaderDimensions,
	name: string,
	value: unknown,
): value is string {
	return (
		typeof value === "string" &&
		(dimensions[name]?.values.includes(value) ?? false)
	);
}

/** A context read back from storage or a link: unknown dimensions and values are dropped, never trusted. */
export function readerContextOf(
	dimensions: ReaderDimensions,
	raw: unknown,
): ReaderContext {
	if (typeof raw !== "object" || raw === null) {
		return {};
	}
	return Object.fromEntries(
		Object.entries(raw).filter(([name, value]) =>
			isKnownValue(dimensions, name, value),
		),
	);
}

/** The context a link carries, `?country=FR&language=fr`. */
export function readerContextFromQuery(
	dimensions: ReaderDimensions,
	query: URLSearchParams,
): ReaderContext {
	return readerContextOf(
		dimensions,
		Object.fromEntries(
			Object.entries(dimensions).flatMap(([name, dimension]) => {
				const value = query.get(dimension.queryParameter);
				return value === null ? [] : [[name, value]];
			}),
		),
	);
}

/** Why an applicability is wrong for a page of these audiences, as messages; empty when it is right. */
export function applicabilityProblems({
	dimensions,
	appliesTo,
	audiences,
}: {
	dimensions: ReaderDimensions;
	appliesTo: Applicability;
	audiences: ReadonlyArray<string>;
}): Array<{ dimension: string; message: string }> {
	const declared = Object.keys(dimensions);
	return Object.entries(appliesTo).flatMap(([name, values = []]) => {
		const dimension = dimensions[name];
		if (!dimension) {
			return [
				{
					dimension: name,
					message: `unknown dimension (one of ${declared.join(", ")})`,
				},
			];
		}
		const unknown = values.filter((value) => !dimension.values.includes(value));
		const concerned = audiences.some((audience) =>
			dimension.audiences.includes(audience),
		);
		return [
			...unknown.map((value) => ({
				dimension: name,
				message: `${value} is not a value (one of ${dimension.values.join(", ")})`,
			})),
			...(concerned
				? []
				: [
						{
							dimension: name,
							message: `only concerns ${dimension.audiences.join(", ")} pages`,
						},
					]),
		];
	});
}

/** Every full context an audience can be in: one value per dimension it is asked. */
export function contextCombinations(
	dimensions: ReaderDimensions,
	audience: string,
): Array<ReaderContext> {
	return dimensionsFor(dimensions, audience).reduce<Array<ReaderContext>>(
		(combinations, name) =>
			combinations.flatMap((combination) =>
				(dimensions[name]?.values ?? []).map((value) => ({
					...combination,
					[name]: value,
				})),
			),
		[{}],
	);
}
