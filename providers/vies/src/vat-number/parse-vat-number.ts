import { Option, Schema } from "effect";
import {
	countryOfVatPrefix,
	isViesCountryCode,
	type ViesCountryCode,
	vatPrefixOf,
} from "../registry/vies-country-code.ts";
import { VatNumber } from "./vat-number.ts";

/** A VAT number split the way VIES takes it. */
export interface ViesVatNumber {
	readonly countryCode: ViesCountryCode;
	/** Without the country prefix. */
	readonly vatNumber: string;
}

const isVatNumber = Schema.is(VatNumber);

function withPrefix(compact: string, fallbackCountry: string | null) {
	return /^[A-Z]{2}/u.test(compact) ||
		fallbackCountry === null ||
		!isViesCountryCode(fallbackCountry)
		? compact
		: `${vatPrefixOf(fallbackCountry)}${compact}`;
}

/**
 * Reads a VAT number as people type it (`LU 2026 0743`, `lu20260743`,
 * `20260743`) into what VIES takes, so a number whose shape no member state
 * issues never costs a VIES call. A number typed without its prefix is read
 * under `fallbackCountry`, an ISO 3166-1 code.
 */
export function parseVatNumber(
	typed: string,
	fallbackCountry: string | null,
): Option.Option<ViesVatNumber> {
	const number = withPrefix(
		typed.replace(/[\s.\-/]/gu, "").toUpperCase(),
		fallbackCountry,
	);
	const countryCode = countryOfVatPrefix(number.slice(0, 2));
	return countryCode === null || !isVatNumber(number)
		? Option.none()
		: Option.some({ countryCode, vatNumber: number.slice(2) });
}
