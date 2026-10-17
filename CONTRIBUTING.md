# Contributing

## Layout

- **One idea per file.** A file holds one function, one type, or one small
  group that only makes sense together (`Gate` and its interface). When a file
  starts doing two things, split it.
- **A folder per concept** inside a package (`gate/`, `use-case/`,
  `registry/`…). The dependencies between folders are written down in
  `src/package-structure.test.ts`; a new one is a deliberate edit there.
- **Tests sit next to the file they test**: `gate-combinators.ts` →
  `gate-combinators.test.ts`. Shared fixtures are `*.test-helper.ts`; neither
  is built nor published.
- **One TypeScript config.** A package's `tsconfig.json` extends
  `@voila.dev/typescript-config`: `strict.json` for the Effect packages,
  `react.json` for anything that renders, both for a package that is both. Its
  `tsconfig.build.json` stacks `build.json` on top (tsc emits the JavaScript)
  or `declarations.json` (esbuild emits it, tsc only the types). A compiler
  option belongs in the shared config, not in one package.
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
