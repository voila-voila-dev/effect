# @voila.dev/biome-plugins

An Effect codebase keeps its promises only if nobody reaches around them: one
`Math.random()` and a test can no longer be seeded, one `crypto.randomUUID()`
and identifiers stop being injectable, one `Data.TaggedError` and an endpoint
cannot encode its failure. Code review catches these some of the time; these
[Biome](https://biomejs.dev) GritQL plugins catch them every time.

```sh
bun add -d @voila.dev/biome-plugins @biomejs/biome
```

Requires Biome 2.5 or later. The package ships `.grit` files only, no code.

## Enabling a rule

Biome loads a plugin from a path, so point at the file inside `node_modules`.
Give it `includes` to scope it to the folders where the rule holds:

```jsonc
// biome.json
{
	"plugins": [
		"./node_modules/@voila.dev/biome-plugins/rules/no-math-random.grit",
		{
			"path": "./node_modules/@voila.dev/biome-plugins/rules/use-run-main.grit",
			"includes": ["**/scripts/**", "!**/*.test.ts"]
		}
	]
}
```

Start each `includes` glob with `**/`: Biome matches plugin globs against the
full path of the file.

A deliberate exception is suppressed in the file, with its reason:

```ts
// biome-ignore lint/plugin: the identifier service itself
const id = Bun.randomUUIDv7();
```

## Rules

### `no-data-tagged-error`

Forbids `Data.TaggedError(...)`. A `Data.TaggedError` has no schema, so it
cannot be declared on an `HttpApi` endpoint or an RPC, nor decoded by the
client. `Schema.TaggedError` is yieldable the same way and also encodes.
Enable it where errors are declared (domain and application code).

### `no-math-random`

Forbids `Math.random()`. It cannot be seeded, so code that uses it cannot be
tested deterministically. Draw from Effect's `Random` service
(`Random.next`, `Random.nextIntBetween`, `Random.shuffle`), which a test
replaces with `Random.withSeed`; use `crypto.getRandomValues` for secrets.
Usually excluded from `*.test.ts`.

### `no-random-uuid`

Forbids `crypto.randomUUID()`, `globalThis.crypto.randomUUID()` and a bare
`randomUUID()`. Identifiers should come from a service provided as a `Layer`:
tests pin them, and the format (a time-ordered UUIDv7 keeps database indexes
compact) is chosen once. Exclude the file that implements that service.

### `no-schema-disable-checks`

Forbids `disableChecks: true`, which constructs a schema class or value
without its checks and lets a value that breaks its invariants into the
domain. Construct with `make` (throws) or `makeEffect` (fails in the error
channel). Exclude tests and fixtures, where an invalid value is the point.

### `use-run-main`

Forbids `process.exit(...)` and `Effect.runPromise`, `runPromiseExit`,
`runSync`, `runSyncExit`, `runFork`. A program's entrypoint ends with
`runMain` from `@effect/platform-bun` or `@effect/platform-node`, which sets
the exit code, interrupts the fiber on SIGINT so finalizers run, and reports
the failure. Enable it on entrypoints and scripts only: libraries and tests
legitimately run effects at their edge.

## Not included

A rule forbidding `vitest` imports: which test runner a repository uses is not
an Effect concern, and Biome's own `noRestrictedImports` already does it.
