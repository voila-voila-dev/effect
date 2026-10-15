# @voila.dev/env

Load `.env` files without a `FileSystem` service, the same way in Bun, Node and
tests.

- **Several files, earlier wins**: list `.env.local` before `.env`.
- **The real environment always wins**: an exported CI or production value is
  never overwritten by a file.
- A missing file is skipped; a malformed line is ignored, not fatal.

```sh
bun add @voila.dev/env effect
```

## With Effect

```ts
import { environmentFilesLayer } from "@voila.dev/env/effect";
import { Config, Effect } from "effect";

const program = Config.Number("PORT");

Effect.runPromise(
	program.pipe(Effect.provide(environmentFilesLayer([".env.local", ".env"]))),
);
```

`environmentFilesProvider(paths, options)` returns the `ConfigProvider` itself,
to combine with `ConfigProvider.orElse` or `nested`.

## Without Effect

For tools that read `process.env` directly (a drizzle-kit config, a script),
the root entry has no dependency on Effect:

```ts
import { loadEnvironmentFiles } from "@voila.dev/env";

loadEnvironmentFiles([".env.local", ".env"]);
```

Also exported: `parseEnvironment(text)`, `readEnvironmentFile(path)` (`null`
when missing) and `mergeEnvironment(paths, base)`.

## Syntax

`KEY=value`, `export KEY=value`, `# comments`, `"double"` (with `\n` and `\"`
escapes) and `'single'` (literal) quotes. An unquoted value ends at ` #`; a
bare `#` is kept, so `pa#ss` survives.
