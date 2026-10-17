import { DateTime, Effect, Layer, Option } from "effect";
import { Vies } from "../registry/vies.ts";
import type { ViesCountryCode } from "../registry/vies-country-code.ts";
import { ViesUnavailableError } from "../registry/vies-unavailable-error.ts";
import { ViesVatNumberCheck } from "../registry/vies-vat-number-check.ts";

function keyOf(countryCode: ViesCountryCode, vatNumber: string) {
	return `${countryCode}${vatNumber}`;
}

/**
 * VIES held in memory, for tests and local runs. A number registered with
 * `seedValid` is valid, under the name and address given; any other is
 * invalid. A key (`LU20260743`) added to `unavailableNumbers` fails the way a
 * member state outage would; `checked` lists the keys asked for, in order.
 */
export function inMemoryVies() {
	const registrations = new Map<
		string,
		{
			readonly name: Option.Option<string>;
			readonly address: Option.Option<string>;
		}
	>();
	const unavailableNumbers = new Set<string>();
	const checked: Array<string> = [];

	const service: typeof Vies.Service = {
		checkVatNumber: ({ countryCode, vatNumber }) =>
			Effect.gen(function* () {
				const key = keyOf(countryCode, vatNumber);
				checked.push(key);
				if (unavailableNumbers.has(key)) {
					return yield* new ViesUnavailableError({
						message: `VIES unavailable for ${key}`,
					});
				}
				const registration = Option.fromNullishOr(registrations.get(key));
				return ViesVatNumberCheck.make({
					countryCode,
					vatNumber,
					valid: Option.isSome(registration),
					name: Option.flatMap(registration, ({ name }) => name),
					address: Option.flatMap(registration, ({ address }) => address),
					requestDate: yield* DateTime.now,
				});
			}),
	};

	return {
		checked,
		unavailableNumbers,
		seedValid: (input: {
			readonly countryCode: ViesCountryCode;
			readonly vatNumber: string;
			readonly name?: string;
			readonly address?: string;
		}) => {
			registrations.set(keyOf(input.countryCode, input.vatNumber), {
				name: Option.fromNullishOr(input.name),
				address: Option.fromNullishOr(input.address),
			});
		},
		service,
		layer: Layer.succeed(Vies, service),
	};
}
