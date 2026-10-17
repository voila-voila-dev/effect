# @voila.dev/annuaire-entreprises

The [Annuaire des Entreprises](https://annuaire-entreprises.data.gouv.fr) is
France's free, keyless company directory: give it a SIRET and it says which
company holds that establishment, whether it is still trading, its legal form,
its directors and its address. Every KYB flow, invoice form and onboarding
screen for French businesses needs that answer, and every hand-written client
gets the same things wrong: it trusts a search hit that is a *different*
establishment of the same company, compares a name against
`[NON-DIFFUSIBLE]`, retries a 429 in the same second, or reads an outage as
"no such company".

This package is that client on [Effect](https://effect.website), with a
contract you can replace and an in-memory fake for your tests.

```sh
bun add @voila.dev/annuaire-entreprises @voila.dev/http effect
```

## Looking up a SIRET

```ts
import {
	AnnuaireEntreprises,
	annuaireEntreprisesLayer,
} from "@voila.dev/annuaire-entreprises";
import { Effect, Option } from "effect";

const program = Effect.gen(function* () {
	const directory = yield* AnnuaireEntreprises;
	const found = yield* directory.findBySiret("95292208600014");
	return Option.map(found, (company) => ({
		name: company.legalName,
		trading: company.isActive,
		directors: company.representatives.map((person) => person.lastName),
	}));
});

Effect.runPromise(program.pipe(Effect.provide(annuaireEntreprisesLayer())));
```

`findBySiret` answers none when no company holds that SIRET; it fails with
`AnnuaireEntreprisesUnavailableError` only when the directory could not
answer, so the two never get confused.

An `AnnuaireEntreprisesEstablishment` carries:

- `siren`, `legalName`, `legalForm` (the INSEE `nature_juridique` code),
  `activityCode` (NAF), `isActive`;
- `isSoleTrader` — an entrepreneur individuel, whose legal name is their own;
- `identityWithheld` — the owner opted out of INSEE diffusion: the name is a
  placeholder and the directors are masked;
- `representatives` — the natural persons running the company (name, role,
  birth month), masked ones left out;
- `address` — the establishment's street, postal code and city, or null when
  the directory prints none.

## Searching by name

```ts
const results = yield* directory.searchByName({
	query: "stade de reims",
	postalCode: "51450", // optional
	limit: 5,
});
// [{ siret: "44116434000032", establishment: { legalName: "SASP STADE DE REIMS", … } }, …]
```

Active companies only, best match first, each through its head office.

## What happens on the wire

Requests go through `sendOutbound` from
[`@voila.dev/http`](../http), as the partner `annuaire-entreprises`:

- each attempt is bounded by 15 seconds;
- a 5xx, a timeout or a dropped connection is retried twice, quickly;
- a 429 (the API allows 7 requests per second) is retried four times over
  about ten seconds;
- any other refusal, and an answer whose shape changed, fail at once;
- the call runs in a span `outbound.annuaire-entreprises.search`.

Provide `recordingFetchLayer` from `@voila.dev/http` and every request lands
in your request log. `annuaireEntreprisesLayer({ partner, transientRetry,
rateLimitedRetry })` changes the partner name and the backoffs.

## In tests

```ts
import {
	AnnuaireEntreprisesEstablishment,
	inMemoryAnnuaireEntreprises,
} from "@voila.dev/annuaire-entreprises";

const directory = inMemoryAnnuaireEntreprises();
directory.seed("12345678900011", new AnnuaireEntreprisesEstablishment({ … }));
directory.unavailableSirets.add("98765432100011"); // fails like an outage

program.pipe(Effect.provide(directory.layer));
directory.lookedUp; // the SIRETs asked for, in order
```

## License

MIT
