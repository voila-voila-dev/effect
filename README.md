# voila.dev / effect

Building blocks for B2B backends on [Effect](https://effect.website) 4, extracted
from production code and kept free of any one product's vocabulary.

| Package | What it gives you |
| --- | --- |
| [`@voila.dev/biome-plugins`](./packages/biome-plugins) | Biome lint rules that keep an Effect codebase honest: schema-backed errors, seedable randomness, injected identifiers, validated construction, `runMain` entrypoints. |
| [`@voila.dev/cache-lock`](./packages/cache-lock) | A key-value cache, a lease-based lock and a rate limiter as Effect services, in memory or on Redis, with failures the caller decides on. |
| [`@voila.dev/crypto`](./packages/crypto) | A secret box bound to its record, signed token kinds with no token table, token digests and secure random, on Web Crypto. |
| [`@voila.dev/effect-ddd`](./packages/effect-ddd) | Use cases with a declared gate, a registry, a permission catalogue, and architecture tests that freeze your bounded-context boundaries. |
| [`@voila.dev/env`](./packages/env) | `.env` files into `process.env` or an Effect `ConfigProvider`: several files, earlier wins, the real environment always wins. |

More are on the way (an outbox and event bus over Postgres, an integration HTTP
client, a WebSocket hub) — see the
[roadmap](#roadmap).

## Example

[`examples/organizations`](./examples/organizations) is a small context written
the way these packages expect: actors and gates in `identity/`, an aggregate, a
repository service with an in-memory adapter, two use cases, a registry, and an
architecture test that fails the build when `identity` imports a business
context.

```ts
export const RenameOrganizationUseCase = UseCase.make({
	name: "organization.rename-organization",
	input: Input,
	gate: member<typeof Input.Type>("organization.manage"),
	execute: ({ actor, payload }) =>
		organizations.transition(actor, payload.organizationId, (organization) =>
			organization.rename(payload.name),
		),
});
```

## Development

```sh
bun install
bun run ci            # Biome
bun run check-types
bun run test
bun run build
```

Packages resolve each other through their sources (the `@voila.dev/source`
export condition), so no build is needed while developing.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the conventions. A change to a
published package comes with a changeset (`bun run changeset`).
Merging to `main` opens the "Version packages" PR; merging that publishes.

## Roadmap

1. `effect-ddd`, `env`, `biome-plugins` — **0.1**
2. `outbox`, `http`, `crypto`, `cache-lock`, `live`
3. Documentation site on `@voila.dev/docs`

Third-party adapters (Stripe, Resend, Annuaire Entreprises, VIES…) live in their
own repositories under [voila-voila-dev](https://github.com/voila-voila-dev) and
implement the contracts defined here.

## License

MIT
