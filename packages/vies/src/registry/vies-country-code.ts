import { Schema } from "effect";

/**
 * The member states VIES answers for, as ISO 3166-1 codes. Any other country
 * comes back as `INVALID_INPUT`, so the contract refuses it at the type.
 * Northern Ireland (`XI` in VIES) has no ISO code of its own and is left out.
 */
export const VIES_COUNTRY_CODES = [
	"AT",
	"BE",
	"BG",
	"CY",
	"CZ",
	"DE",
	"DK",
	"EE",
	"ES",
	"FI",
	"FR",
	"GR",
	"HR",
	"HU",
	"IE",
	"IT",
	"LT",
	"LU",
	"LV",
	"MT",
	"NL",
	"PL",
	"PT",
	"RO",
	"SE",
	"SI",
	"SK",
] as const;

export const ViesCountryCode = Schema.Literals(VIES_COUNTRY_CODES);

export type ViesCountryCode = typeof ViesCountryCode.Type;

export const isViesCountryCode = Schema.is(ViesCountryCode);

// Greece prefixes its VAT numbers, and is keyed in VIES, as `EL`, not `GR`.
const VAT_PREFIX_BY_COUNTRY: Partial<Record<ViesCountryCode, string>> = {
	GR: "EL",
};

/** The prefix a country's VAT numbers carry: its ISO code, except `EL` for Greece. */
export function vatPrefixOf(countryCode: ViesCountryCode): string {
	return VAT_PREFIX_BY_COUNTRY[countryCode] ?? countryCode;
}

/** The country a VAT prefix names; null when VIES answers for no such prefix. */
export function countryOfVatPrefix(prefix: string): ViesCountryCode | null {
	return (
		VIES_COUNTRY_CODES.find((country) => vatPrefixOf(country) === prefix) ??
		null
	);
}
