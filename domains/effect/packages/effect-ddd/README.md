# @voila.dev/effect-ddd

Domain-driven, hexagonal applications on Effect 4: every use case declares its
name, its input, **who may call it**, and what it does — and the codebase's
boundaries are tests, not review comments.

```sh
bun add @voila.dev/effect-ddd effect
```

## Use cases and gates

```ts
import { Gate, permissionRef, UseCase } from "@voila.dev/effect-ddd";

const member = (permission: string) =>
	Gate.when<typeof Input.Type>({
		label: `member with ${permission}`,
		permissions: [permissionRef("organization", permission)],
		allows: ({ actor, payload }) =>
			actor.permissions[payload.organizationId]?.includes(permission) ?? false,
	});

export const IssueInvoiceUseCase = UseCase.make({
	name: "billing.issue-invoice",
	input: Input, // Schema.Struct({ actor, payload: Schema.Struct({ … }) })
	gate: member("invoice.manage"),
	execute: ({ payload }) => issue(payload),
});
```

`execute` opens a span named after the use case, records the actor kind and
the permissions the gate checked, runs the gate, then the body. It counts every
run in `unit_runs_total` by outcome — `ok`, `failed`, or `denied`, so a
permission problem never hides in the error rate — and times it in
`unit_duration`.

A gate decides from the input alone, before anything is loaded, and needs no
service: the facts it reads travel with the actor. That keeps it pure, so a
read model can ask it too (`gateHolds`) and a catalogue can list permissions
from the declarations. `Gate.anyone()`, `Gate.bearer("the reset link")`,
`Gate.make`, `Gate.when`, `Gate.either`, `Gate.all`.

Need your own span attributes (user id, tenant)? Build your constructor once:

```ts
export const UseCase = makeUseCaseConstructor({
	annotate: (input) => ({ "user.id": userIdOf(input.actor) }),
});
```

## Aggregates

`makeAggregateActions({ repository, load, notFoundError, save, gate? })` gives a
context `loadOrFail(actor, id)` and `transition(actor, id, apply)` — load,
apply, save — with the optional gate run before the load, so a caller cannot
probe which ids exist.

## Registry and permissions

```ts
import * as billing from "./billing/use-cases/index.ts";
export const useCases = collectUseCases([billing /* , … */]);
```

- `registryProblems(useCases, expectedNames)` — duplicates, names no file backs,
  files never registered.
- `unknownPermissions(useCases, known)` — gates naming a permission that does
  not exist.
- `permissionCatalogue(useCases)` — what each permission unlocks.

## Architecture tests

`@voila.dev/effect-ddd/architecture` reads your sources and returns plain
arrays, so any test runner can assert on them:

```ts
const root = import.meta.dirname;
const contextOf = contextResolver({ groupingDirectories: ["platform"] });
const edges = importEdges({ root, files: listSourceFiles(root), contextOf, alias: "#" });

expect(describeEdges(undeclaredEdges(edges, ALLOWED_EDGES, isBusiness))).toEqual([]);
expect(staleEdges(edges, ALLOWED_EDGES)).toEqual([]);
```

- `listSourceFiles`, `contextResolver`, `useCaseNameOf`
- `importEdges`, `describeEdges`, `undeclaredEdges`, `staleEdges`
- `ratchet(baseline, offenders)` — a list of known exceptions that may only
  shrink: new offenders fail, and so do fixed entries left in the baseline.

See [`examples/organizations`](../../examples/organizations) for all of it
together.
