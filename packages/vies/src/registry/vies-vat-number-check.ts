import { Schema } from "effect";
import { ViesCountryCode } from "./vies-country-code.ts";

/**
 * What VIES answered about one VAT number. `name` and `address` are none when
 * the member state withholds them (Germany never publishes them) or when the
 * number is invalid.
 */
export class ViesVatNumberCheck extends Schema.Class<ViesVatNumberCheck>(
	"ViesVatNumberCheck",
)({
	countryCode: ViesCountryCode,
	/** Without the country prefix, as VIES echoes it back. */
	vatNumber: Schema.String,
	valid: Schema.Boolean,
	name: Schema.Option(Schema.String),
	address: Schema.Option(Schema.String),
	/** VIES's own timestamp, the date a tax audit asks for. */
	requestDate: Schema.DateTimeUtc,
}) {}
