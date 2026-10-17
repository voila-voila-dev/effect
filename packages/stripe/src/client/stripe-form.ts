/** A value Stripe takes in a form body or a query string, nested as deep as its API nests. */
export type StripeFormValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| ReadonlyArray<StripeFormValue>
	| { readonly [key: string]: StripeFormValue };

export type StripeForm = { readonly [key: string]: StripeFormValue };

function append(
	pairs: Array<[string, string]>,
	key: string,
	value: StripeFormValue,
): void {
	if (value === undefined) return;
	if (value === null) {
		// Stripe reads an empty value as "unset this field".
		pairs.push([key, ""]);
	} else if (Array.isArray(value)) {
		value.forEach((item, index) => {
			append(pairs, `${key}[${index}]`, item);
		});
	} else if (typeof value === "object") {
		for (const [name, item] of Object.entries(value)) {
			append(pairs, `${key}[${name}]`, item);
		}
	} else {
		pairs.push([key, String(value)]);
	}
}

/**
 * A form in Stripe's bracket notation:
 * `{ metadata: { order: "42" }, expand: ["customer"] }` becomes
 * `metadata[order]=42&expand[0]=customer`. `undefined` is left out and
 * `null` sent empty, which is how Stripe unsets a field.
 */
export function encodeStripeForm(form: StripeForm): string {
	const pairs: Array<[string, string]> = [];
	for (const [key, value] of Object.entries(form)) {
		append(pairs, key, value);
	}
	return new URLSearchParams(pairs).toString();
}
