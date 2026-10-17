# Contributing

## Layout

The repository is split by domain. Each domain keeps its published packages,
its sites and its examples side by side:

```
packages/                  repository tooling shared by every domain
  typescript-config/       the tsconfig bases
  biome-plugins/           lint rules for Effect codebases
domains/
  effect/                  the backend groundwork: effect-ddd, crypto, env,
    packages/              http, live, outbox, cache-lock
    examples/
  email/packages/          email: sending, the delivery outbox and log, the
                           suppression list
  providers/packages/      one adapter per third party: resend, stripe,
                           annuaire-entreprises, vies
  docs/packages/           docs (framework-free) and ui-docs (its React layer)
  ui/
    packages/              ui, chart, motion, ui-branding
    apps/                  ui.voila.dev, storybook.ui.voila.dev, emoji.voila.dev
```

A new domain is a `domains/<name>/` folder with `packages/`, and `apps/` or
`examples/` when it has some; the root workspaces pick them up. The npm names
do not follow the folders: a package keeps its `@voila.dev/*` name wherever it
lives.

Inside a package:

- **One idea per file.** A file holds one function, one type, or one small
  group that only makes sense together (`Gate` and its interface). When a file
  starts doing two things, split it.
- **A folder per concept** inside a package (`gate/`, `use-case/`,
  `registry/`…). The dependencies between folders are written down in
  `src/package-structure.test.ts`; a new one is a deliberate edit there.
- **Tests sit next to the file they test**: `gate-combinators.ts` →
  `gate-combinators.test.ts`. Shared fixtures are `*.test-helper.ts`; neither
  is built nor published.
- **`index.ts` only re-exports.** The public API is what the package `index.ts`
  lists, nothing else.

## Code

- Pure functions first; the file system, the clock and the network stay at the
  edges (`parse-environment.ts` parses, `environment-file.ts` reads).
- Comments say **why**, never what. A doc comment states the contract a caller
  relies on.
- No product vocabulary: these packages serve any B2B backend.
- Relative imports with the `.ts` extension; the build rewrites them.

## Workflow

```sh
bun install
bun run ci && bun run check-types && bun run test && bun run build
bun run changeset   # for any change to a published package
```
