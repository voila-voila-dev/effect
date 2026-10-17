import { Context, type Effect } from "effect";
import type { ViesCountryCode } from "./vies-country-code.ts";
import type { ViesRejectedInputError } from "./vies-rejected-input-error.ts";
import type { ViesUnavailableError } from "./vies-unavailable-error.ts";
import type { ViesVatNumberCheck } from "./vies-vat-number-check.ts";

/**
 * The European Commission's VAT Information Exchange System: says whether an
 * intracommunity VAT number is registered, and under which name when the
 * member state publishes it.
 */
export class Vies extends Context.Service<
	Vies,
	{
		readonly checkVatNumber: (input: {
			readonly countryCode: ViesCountryCode;
			/** Without the country prefix: `20260743`, not `LU20260743`. */
			readonly vatNumber: string;
		}) => Effect.Effect<
			ViesVatNumberCheck,
			ViesUnavailableError | ViesRejectedInputError
		>;
	}
>()("@voila.dev/vies/Vies") {}
