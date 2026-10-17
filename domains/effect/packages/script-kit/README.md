# @voila.dev/script-kit

The foundation of tooling scripts (backfills, checks, CI steps) written with
Effect and run by Bun.

- **One entrypoint**: `runScript(command)` parses argv (typed flags, `--help`
  and `--version` for free), loads the env files and lets `BunRuntime.runMain`
  render failures and set the exit code. No `process.exit`.
- **Dry run by default**: `commitFlag` is `false` unless `--commit` is passed;
  `limitFlag` caps how many items a run touches.
- **Findings, not crashes**: `failScript(message, details)` prints the details
  and fails with a `ScriptFailure`.
- **Subprocesses**: `commandText` returns a command's stdout, `spawnForeground`
  and `runStep` run one with the terminal attached.
- **GitHub Actions**: `mask`, `warn` and `setOutputs` for a script run as a step.

```sh
bun add @voila.dev/script-kit effect @effect/platform-bun
```

## A script

```ts
import { commitFlag, limitFlag, runScript } from "@voila.dev/script-kit";
import { Console, Effect } from "effect";
import { Command } from "effect/cli";

const command = Command.make(
	"backfill-coordinates",
	{ commit: commitFlag, limit: limitFlag },
	({ commit, limit }) =>
		Console.log(commit ? `Saving up to ${limit}` : "Dry run"),
);

runScript(command);
```

## Env files

`runScript` loads `.env.local`, `.env.development` and `.env` from the
repository root (the nearest directory holding `.git`), earliest wins, and a
variable already in the environment always wins. A repository with other files
bakes them in once:

```ts
// packages/scripts/src/run-script.ts
import { makeRunScript } from "@voila.dev/script-kit";

export const runScript = makeRunScript({
	environmentFiles: [".env.local", ".env", "apps/api/.env.development"],
});
```

`scriptEnvironmentLayer(files)` is the same loading as a `Layer`, for a script
that reads env before its command runs.
