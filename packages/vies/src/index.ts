export { makeVies, type ViesOptions, viesLayer } from "./api/make-vies.ts";
export { inMemoryVies } from "./in-memory/in-memory-vies.ts";
export { Vies } from "./registry/vies.ts";
export {
	countryOfVatPrefix,
	isViesCountryCode,
	VIES_COUNTRY_CODES,
	ViesCountryCode,
	vatPrefixOf,
} from "./registry/vies-country-code.ts";
export { ViesRejectedInputError } from "./registry/vies-rejected-input-error.ts";
export { ViesUnavailableError } from "./registry/vies-unavailable-error.ts";
export { ViesVatNumberCheck } from "./registry/vies-vat-number-check.ts";
export {
	parseVatNumber,
	type ViesVatNumber,
} from "./vat-number/parse-vat-number.ts";
export { VatNumber } from "./vat-number/vat-number.ts";
