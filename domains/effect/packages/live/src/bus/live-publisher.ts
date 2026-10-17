import { Context, type Effect } from "effect";
import type { LivePublication } from "../message/live-message.ts";
import type { LivePublishError } from "./live-publish-error.ts";

/** Hands a publication to the bus, which numbers it and delivers it to every process's sockets. */
export class LivePublisher extends Context.Service<
	LivePublisher,
	{
		readonly publish: (
			publication: LivePublication,
		) => Effect.Effect<void, LivePublishError>;
	}
>()("@voila.dev/live/LivePublisher") {}
