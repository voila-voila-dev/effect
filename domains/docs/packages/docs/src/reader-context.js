/** The dimensions an audience is asked, in the site's order. */
export function dimensionsFor(dimensions, audience) {
    return Object.entries(dimensions)
        .filter(([, dimension]) => dimension.audiences.includes(audience))
        .map(([name]) => name);
}
/**
 * Why a page does not apply to the reader, empty when it does. A dimension
 * the reader has not answered never rules a page out: nobody loses a page for
 * not saying where they work.
 */
export function contextMismatches(appliesTo, context) {
    return Object.entries(appliesTo ?? {}).flatMap(([dimension, values]) => {
        const chosen = context[dimension];
        return values && chosen !== undefined && !values.includes(chosen)
            ? [{ dimension, values }]
            : [];
    });
}
function isKnownValue(dimensions, name, value) {
    return (typeof value === "string" &&
        (dimensions[name]?.values.includes(value) ?? false));
}
/** A context read back from storage or a link: unknown dimensions and values are dropped, never trusted. */
export function readerContextOf(dimensions, raw) {
    if (typeof raw !== "object" || raw === null) {
        return {};
    }
    return Object.fromEntries(Object.entries(raw).filter(([name, value]) => isKnownValue(dimensions, name, value)));
}
/** The context a link carries, `?country=FR&language=fr`. */
export function readerContextFromQuery(dimensions, query) {
    return readerContextOf(dimensions, Object.fromEntries(Object.entries(dimensions).flatMap(([name, dimension]) => {
        const value = query.get(dimension.queryParameter);
        return value === null ? [] : [[name, value]];
    })));
}
/** Why an applicability is wrong for a page of these audiences, as messages; empty when it is right. */
export function applicabilityProblems({ dimensions, appliesTo, audiences, }) {
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
        const concerned = audiences.some((audience) => dimension.audiences.includes(audience));
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
export function contextCombinations(dimensions, audience) {
    return dimensionsFor(dimensions, audience).reduce((combinations, name) => combinations.flatMap((combination) => (dimensions[name]?.values ?? []).map((value) => ({
        ...combination,
        [name]: value,
    }))), [{}]);
}
