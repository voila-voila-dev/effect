import { Schema } from "effect";

/**
 * One pattern per EU member state (keyed by the number's 2-letter prefix),
 * plus `EL` for Greece and `XI` for Northern Ireland's post-Brexit EU-goods
 * scheme. Patterns validate the national structure only — not the check
 * digits, which stay VIES's concern.
 */
const EU_VAT_PATTERNS: ReadonlyArray<RegExp> = [
	/^ATU\d{8}$/u, // Austria
	/^BE[01]\d{9}$/u, // Belgium
	/^BG\d{9,10}$/u, // Bulgaria
	/^CY\d{8}[A-Z]$/u, // Cyprus
	/^CZ\d{8,10}$/u, // Czechia
	/^DE\d{9}$/u, // Germany
	/^DK\d{8}$/u, // Denmark
	/^EE\d{9}$/u, // Estonia
	/^EL\d{9}$/u, // Greece
	/^ES[A-Z0-9]\d{7}[A-Z0-9]$/u, // Spain
	/^FI\d{8}$/u, // Finland
	/^FR[A-HJ-NP-Z0-9]{2}\d{9}$/u, // France — the key excludes I and O
	/^HR\d{11}$/u, // Croatia
	/^HU\d{8}$/u, // Hungary
	/^IE(\d{7}[A-W]{1,2}|\d[A-Z+*]\d{5}[A-W])$/u, // Ireland — new and legacy styles
	/^IT\d{11}$/u, // Italy
	/^LT(\d{9}|\d{12})$/u, // Lithuania
	/^LU\d{8}$/u, // Luxembourg
	/^LV\d{11}$/u, // Latvia
	/^MT\d{8}$/u, // Malta
	/^NL[A-Z0-9+*]{9}B\d{2}$/u, // Netherlands — sole traders may carry letters
	/^PL\d{10}$/u, // Poland
	/^PT\d{9}$/u, // Portugal
	/^RO\d{2,10}$/u, // Romania
	/^SE\d{10}01$/u, // Sweden
	/^SI\d{8}$/u, // Slovenia
	/^SK\d{10}$/u, // Slovakia
	/^XI(\d{9}|\d{12}|(GD|HA)\d{3})$/u, // Northern Ireland
];

/**
 * An EU intracommunity VAT identification number, uppercase and unspaced
 * (`FR20913180733`, `DE123456789`), in a shape its member state issues.
 */
export const VatNumber = Schema.String.pipe(
	Schema.check(
		Schema.makeFilter(
			(value: string) =>
				EU_VAT_PATTERNS.some((pattern) => pattern.test(value)) ||
				"must be a valid EU VAT number (country prefix + national format)",
		),
	),
).pipe(Schema.brand("VatNumber"));

export type VatNumber = typeof VatNumber.Type;
