# @voila.dev/outbox

A change commits, then the process dies before the "order placed" email goes
out. Or the email goes out and the transaction rolls back. Publishing an event
*next to* a database write is never reliable; publishing it *in* the write is.

- **Transactional outbox**: `publish` inserts the event in the same
  transaction as the change. They commit together or not at all.
- **At-least-once delivery**: a worker claims due messages (`FOR UPDATE SKIP
  LOCKED`, so several instances never take the same row), runs the
  subscribers, and retries failures with exponential backoff.
- **Poison messages are parked**, not retried forever: after `maxAttempts`
  failures, or at once when the payload no longer decodes.
- **Jobs**: cron-scheduled ticks with a timeout, a span and the same metrics.

Subscriber runs and job ticks report through `unitMetrics` from
[`@voila.dev/effect-ddd`](../effect-ddd) (`unit_runs_total` and
`unit_duration`, kind `subscriber` / `job`).

```sh
bun add @voila.dev/outbox effect
```

## Events and a bus

Events are your own `Schema.TaggedClass`es. A channel names where they travel
and how they are encoded; the bus service is yours too.

```ts
import { EventBus, type EventChannel } from "@voila.dev/outbox";
import { Context, Schema } from "effect";

class OrderPlaced extends Schema.TaggedClass<OrderPlaced>()("OrderPlaced", {
	orderId: Schema.String,
	total: Schema.Number,
}) {}
const OrderEvent = Schema.Union([OrderPlaced /* , OrderShipped … */]);
type OrderEvent = typeof OrderEvent.Type;

export const orderChannel: EventChannel<OrderEvent> = {
	name: "orders",
	schema: OrderEvent,
};

export class OrderEvents extends Context.Service<
	OrderEvents,
	EventBus<OrderEvent>
>()("OrderEvents") {}

export const OrderEventsLayer = EventBus.layer(OrderEvents, orderChannel);
```

Publish inside the transaction that makes the change:

```ts
const placeOrder = Effect.gen(function* () {
	const sql = yield* SqlClient.SqlClient;
	const events = yield* OrderEvents;
	yield* sql`INSERT INTO orders ${sql.insert(order)}`;
	yield* events.publish(new OrderPlaced({ orderId: order.id, total: 42 }));
}).pipe(sql.withTransaction);
```

A failed `publish` fails the caller, on purpose: swallowing it would let the
change commit without its events.

Each message gets a time-ordered UUIDv7 from the `MessageIds` reference, which
needs no layer; provide your own (`Effect.provideService(MessageIds, { next })`)
to pin ids in a test or use another scheme.

## Subscribers and the worker

```ts
import { outboxWorker, Subscriber } from "@voila.dev/outbox";

const sendConfirmation = Subscriber.make({
	name: "orders.send-confirmation",
	tag: "OrderPlaced",
	run: (event: OrderPlaced, { id }) =>
		mailer.send({ to: event.orderId, idempotencyKey: id }),
});

export const OrderWorkerLayer = Layer.effectDiscard(
	Effect.forkScoped(
		outboxWorker(orderChannel, [sendConfirmation], {
			maxAttempts: 5, // then parked
			backoff: exponentialBackoff({ base: "1 second", max: "1 hour" }),
			pollInterval: "1 second",
		}),
	),
);
```

Delivery is at least once: a subscriber may see an event again after a crash
or a sibling's failure (every subscriber of a message runs before it is
retried), so it stays idempotent — the message `id` is a ready-made key.
`deliver(channel, subscribers, options)` is one pass, if you would rather tick
it from a job; it returns `{ claimed, delivered, retried, parked }`.

## Stores

`OutboxStore` is the contract (`append`, `claim`, `complete`, `retry`, `park`,
`prune`).

- **In memory**, for tests: `inMemoryOutboxStore()` returns `{ layer,
  messages }`; `messages()` lets a test assert on what was published without a
  worker. Time comes from the `Clock`, so a `TestClock` drives leases and
  backoff. It has no transaction to join.
- **Postgres**: `PostgresOutboxStore.layer({ table?: "outbox" })` from
  `@voila.dev/outbox/postgres`, on any `SqlClient` from `effect/sql` — the
  package ships no driver, provide the client your application already has
  (`@effect/sql-pg`, or your own over `pg` or `Bun.SQL`).

```ts
import { PostgresOutboxStore } from "@voila.dev/outbox/postgres";

const OutboxLayer = Layer.mergeAll(OrderEventsLayer, OrderWorkerLayer).pipe(
	Layer.provideMerge(PostgresOutboxStore.layer()),
	Layer.provide(PgClientLayer),
);
```

### Migration

The table is yours to create, with your migration tool:
[`migrations/0001_create_outbox.sql`](./migrations/0001_create_outbox.sql)
(also importable as `@voila.dev/outbox/migrations/0001_create_outbox.sql`).
To use another table name, rename it in the file and pass it as `table`.

Delivered rows stay until you prune them (`store.prune({ olderThan:
Duration.days(7) })`, a good job). Parked rows stay until someone looks:

```sql
SELECT id, tag, attempts, last_error FROM outbox WHERE state = 'parked';
-- redeliver once the cause is fixed
UPDATE outbox SET state = 'pending', attempts = 0, available_at = now()
WHERE id = '…';
```

## Jobs

```ts
import { Job, Jobs, scheduleJob } from "@voila.dev/outbox";

const pruneOutbox = Job.make({
	name: "prune-outbox",
	every: "0 3 * * *", // cron, UTC
	timeout: "5 minutes", // default 10 minutes
	run: Effect.flatMap(OutboxStore, (store) =>
		store.prune({ olderThan: Duration.days(7) }),
	).pipe(Effect.map((pruned) => `pruned=${pruned}`)),
});

export const jobs = Jobs.of([pruneOutbox]); // refuses duplicate names

Layer.effectDiscard(
	Effect.forEach(jobs.all, (job) => Effect.forkScoped(scheduleJob(job))),
);
```

`run` resolves to a one-line summary, which `runJob` logs. A cron expression
that does not parse throws at import. `scheduleJob` runs in this process; with
several instances every instance ticks, so keep jobs idempotent or feed
`job.cron` and `runJob(job)` to a single runner such as `ClusterCron`.
