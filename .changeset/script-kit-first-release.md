---
"@voila.dev/script-kit": minor
---

First release: the foundation of Bun tooling scripts on Effect. `runScript` (and `makeRunScript` for a repository's own env files) parses the command, loads `.env` files from the repository root and lets `BunRuntime.runMain` own failures and the exit code; `commitFlag` (dry run by default) and `limitFlag`; `failScript` and `ScriptFailure`; `commandText`, `spawnForeground` and `runStep`; `mask`, `warn` and `setOutputs` for GitHub Actions; `saveCounting` for backfills.
