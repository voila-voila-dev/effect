# voila.dev / platform

Building blocks for B2B products, extracted from production code and kept free
of any one product's vocabulary. Everything lives in this repository and is
published as `@voila.dev/*`; a package moves to a repository of its own only
when it needs to.

## Backend on [Effect](https://effect.website) 4

| Package | What it gives you |
| --- | --- |
| [`@voila.dev/biome-plugins`](./packages/biome-plugins) | Biome lint rules that keep an Effect codebase honest: schema-backed errors, seedable randomness, injected identifiers, validated construction, `runMain` entrypoints. |
| [`@voila.dev/cache-lock`](./packages/cache-lock) | A key-value cache, a lease-based lock and a rate limiter as Effect services, in memory or on Redis, with failures the caller decides on. |
| [`@voila.dev/crypto`](./packages/crypto) | A secret box bound to its record, signed token kinds with no token table, token digests and secure random, on Web Crypto. |
| [`@voila.dev/effect-ddd`](./packages/effect-ddd) | Use cases with a declared gate, a registry, a permission catalogue, and architecture tests that freeze your bounded-context boundaries. |
| [`@voila.dev/env`](./packages/env) | `.env` files into `process.env` or an Effect `ConfigProvider`: several files, earlier wins, the real environment always wins. |
| [`@voila.dev/http`](./packages/http) | Outbound calls to third parties with typed timeouts, jittered retries, spans, bounded Schema decoding and a request log; an SSRF-guarded URL fetcher; Stripe, Svix, Twilio and SNS webhook checks. |
| [`@voila.dev/live`](./packages/live) | Live updates over WebSocket: channels with a gate and a filter, a batching socket hub, a replay log on Redis streams, and a reconnecting browser client. |
| [`@voila.dev/outbox`](./packages/outbox) | Domain events written in the same transaction as the change, delivered at least once with retries, backoff and parking (in memory or on Postgres), and cron jobs. |

### Example

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

## Providers

Each one implements a contract you can replace (a `Context.Service`), calls
out through [`@voila.dev/http`](./packages/http) and comes with an in-memory
fake.

| Package | What it gives you |
| --- | --- |
| [`@voila.dev/annuaire-entreprises`](./packages/annuaire-entreprises) | The French company directory: a SIRET to its company, directors and address, a name search, withheld identities flagged, outages typed apart from "not found". |
| [`@voila.dev/vies`](./packages/vies) | EU VAT number checks against VIES, member-state outages told apart from refused input, national VAT formats and a parser for numbers as people type them. |

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

1. `effect-ddd`, `env` — **0.1** on npm
2. `biome-plugins`, `crypto`, `cache-lock`, `http`, `outbox` — **0.1** on npm
3. `live` (WebSocket hub) — merged, first release next
4. Documentation site on `@voila.dev/docs`
5. Providers: `annuaire-entreprises`, `vies` — merged, first release next;
   then `resend` and `stripe`

Next in this repository: the UI packages (`@voila.dev/ui` and its companions)
and `trust` (KYC/KYB).

## License

MIT
