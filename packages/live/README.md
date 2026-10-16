# @voila.dev/live

Pages that refresh themselves when something changes, without polling: a
backend publishes "this order was placed", and every page looking at it hears
about it within a quarter of a second, on whichever instance it is connected
to. This package gives each piece as plain Effect code, so the transport never
decides who may listen.

- **Channels declare who may listen.** A channel has a name, a gate from
  `@voila.dev/effect-ddd` and a filter schema. The gate runs before the
  WebSocket upgrade; the filter is what the page sends to narrow what it gets.
- **Ids, not content.** A message says that something happened to a subject
  (`order` `o-42` was `order.placed`). The page reloads what it shows with its
  own permissions, so a message never leaks a field the reader may not see.
- **Batched.** The hub groups each socket's messages into one frame every
  250 ms, so a burst costs one render.
- **Catches up after a drop.** Every message carries a `seq`. A page that
  reconnects hands back the last one it read and gets what it missed (the last
  1,000 per channel). On Redis, the log is one stream per channel, shared by
  every instance.
- **Bring your server and your Redis client.** The hub takes anything with a
  `send(text)` (Bun's `ServerWebSocket`, a `ws` socket). The Redis bus runs on
  Effect's `Redis` service. The root and `client` entries import neither Bun nor
  `effect/persistence`, so they bundle in a browser or a React Native app.

```sh
bun add @voila.dev/live @voila.dev/effect-ddd effect
```

## Declare a channel

```ts
import { defineLiveChannel, LiveChannelName } from "@voila.dev/live";
import { Schema } from "effect";

export const ordersChannel = defineLiveChannel({
	name: LiveChannelName.make("console.orders"),
	gate: staffOnly, // a Gate<{ actor: Actor }> from @voila.dev/effect-ddd
	filter: Schema.Struct({ regions: Schema.Array(Schema.String) }),
	matches: (filter, message) =>
		filter.regions.includes(message.attributes.region ?? ""),
});
```

A page that sends no filter gets every message of the channel; a filter the
schema cannot decode leaves the socket's filter as it was.

## Publish

```ts
import { LivePublisher } from "@voila.dev/live";

yield* (yield* LivePublisher).publish({
	channel: ordersChannel.name,
	subjectType: "order",
	subjectId: order.id,
	kind: "order.placed",
	at: yield* DateTime.now,
	attributes: { region: order.region },
});
```

Live is best-effort: publish from an event subscriber, log a
`LivePublishError` and move on rather than retrying. A replayed event would
reach the page late and out of order, and the page reloads on the next one.

## Serve the sockets

```ts
import {
	LiveSocketHub,
	openLiveSocket,
	openLiveSubscription,
	receiveLiveFrame,
} from "@voila.dev/live";

const hub = new LiveSocketHub();
const channels = new Map([[ordersChannel.name, ordersChannel]]);

// Before the upgrade: the channel's gate, then what the page missed.
const missed = yield* openLiveSubscription({
	channels,
	channel: name, // from `/live/:channel/stream`
	input: { actor },
	since: url.searchParams.get("since") ?? undefined,
});

// Bun's websocket handlers, once upgraded:
open: (socket) => openLiveSocket({ hub, channel, socket, missed }),
message: (socket, frame) => receiveLiveFrame({ hub, channel, socket, frame: String(frame) }),
close: (socket) => hub.remove(socket),
```

`openLiveSubscription` fails with `LiveChannelNotFoundError` or the gate's
`AccessDeniedError`; answer 404 and 403. The server sends `{ "messages": [...] }`
frames (`LiveFrame`); the page sends `{ "filter": ... }` and pings.

## Pick a bus

In one process (development, tests), the in-memory bus numbers each channel's
messages and hands them straight to the hub:

```ts
import { makeInMemoryLiveBus } from "@voila.dev/live";

const bus = makeInMemoryLiveBus(hub); // bus.layer provides LivePublisher and LiveLog
```

With several instances, publish to Redis streams and run a reader in every
instance that holds sockets:

```ts
import { redisLiveBusLayer, redisLiveReaderLayer } from "@voila.dev/live/redis";

const LiveLayer = Layer.mergeAll(
	redisLiveBusLayer({ prefix: "live:" }),
	redisLiveReaderLayer({
		prefix: "live:",
		hub,
		channels: [...channels.keys()],
		connect: openDedicatedRedis, // a scoped Effect yielding a Redis of its own
	}),
).pipe(Layer.provide(SharedRedisLayer));
```

The reader blocks on `XREAD`, which holds its connection: `connect` opens one
of its own, with the client's automatic reconnection off. After a drop the
reader opens another and resumes from the last id it read, so no message is
lost or delivered twice. A replay that cannot reach Redis answers nothing and
logs a warning: the page reads on from now.

## In the browser

```ts
import { LiveConnection } from "@voila.dev/live/client";

const connection = new LiveConnection({
	socketUrl: async () => {
		const { ticket } = await requestTicket(); // your single-use credential
		return `wss://api.example.com/live/console.orders/stream?ticket=${ticket}`;
	},
	onMessages: (messages) => refetchOrders(messages),
});
connection.setFilter({ regions: ["35"] });
connection.start();
// later: connection.stop();
```

It pings every 25 seconds, reconnects after 1 s, 2 s, 4 s… up to 15 s with
jitter, adds `since` to the URL so the server replays the gap, and hands each
message to `onMessages` once even when the replay overlaps the live frames.
`socketUrl` runs before every attempt, so each connection gets a fresh ticket.

## License

MIT
