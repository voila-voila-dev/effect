# @voila.dev/vies

Selling to a business elsewhere in the EU, you invoice without VAT only once
you have checked its VAT number in
[VIES](https://ec.europa.eu/taxation_customs/vies/), the Commission's register,
and kept the date of that check. The REST endpoint is free and keyless, and
easy to misread: it answers HTTP 200 for most failures, a member state's
service is down or saturated every day, Germany never publishes names, and
Greece is `EL`, not `GR`. A client that reads "member state unavailable" as
"invalid number" refuses a real customer.

This package is that check on [Effect](https://effect.website), the national
VAT formats of every member state, a parser for numbers as people type them,
and an in-memory fake.

```sh
bun add @voila.dev/vies @voila.dev/http effect
```

## Checking a number

```ts
import { parseVatNumber, Vies, viesLayer } from "@voila.dev/vies";
import { Effect, Option } from "effect";

const program = Effect.gen(function* () {
	const typed = parseVatNumber("lu 2026 0743", "FR"); // the customer's input, their country as fallback
	if (Option.isNone(typed)) return "not a VAT number any member state issues";
	const vies = yield* Vies;
	const check = yield* vies.checkVatNumber(typed.value);
	return check.valid
		? `registered as ${Option.getOrElse(check.name, () => "(name withheld)")} on ${check.requestDate}`
		: "not registered";
});

Effect.runPromise(program.pipe(Effect.provide(viesLayer())));
```

A `ViesVatNumberCheck` holds `valid`, the `name` and `address` when the member
state publishes them (`Option`), and VIES's own `requestDate`, the one a tax
audit asks for.

Two failures, which mean different things:

- `ViesUnavailableError` — the member state or the EU service is down or
  saturated, a 5xx, a timeout, an unreadable answer. Already retried twice;
  try again later, and never treat it as an invalid number.
- `ViesRejectedInputError` — VIES refused the input itself (`code`, e.g.
  `VOW-ERR-2600`). The same input fails the same way.

## VAT numbers without a call

- `parseVatNumber(typed, fallbackCountry)` — strips spaces, dots, dashes and
  slashes, uppercases, reads the country from the prefix (or the fallback ISO
  code when there is none), and checks the national format. A number whose
  shape the member state never issues is refused before it costs a request.
- `VatNumber` — a branded Schema of an EU VAT number, uppercase and unspaced,
  in its national format (check digits stay VIES's job). Northern Ireland's
  `XI` numbers included.
- `ViesCountryCode`, `VIES_COUNTRY_CODES`, `vatPrefixOf("GR") === "EL"`,
  `countryOfVatPrefix("EL") === "GR"`.

## What happens on the wire

Requests go through `sendOutbound` from [`@voila.dev/http`](../../../effect/packages/http) as the
partner `vies`, 15 seconds per attempt, inside a span
`outbound.vies.check-vat-number`. Provide `recordingFetchLayer` and every
check lands in your request log. `viesLayer({ partner, retry })` changes the
partner name and the backoff.

## In tests

```ts
import { inMemoryVies } from "@voila.dev/vies";

const vies = inMemoryVies();
vies.seedValid({ countryCode: "LU", vatNumber: "20260743", name: "ACME SARL" });
vies.unavailableNumbers.add("DE123456789"); // fails like an outage

program.pipe(Effect.provide(vies.layer));
vies.checked; // ["LU20260743", …]
```

Any number not seeded is answered invalid.

## License

MIT
