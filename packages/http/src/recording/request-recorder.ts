import { Context } from "effect";
import type { RecordedRequest } from "./recorded-request.ts";

/**
 * Where recorded requests go: a table, a queue, a log stream. `record` runs on
 * the caller's request path, so an implementation must neither throw nor
 * wait; one writing to a database buffers and flushes off that path.
 */
export class RequestRecorder extends Context.Service<
	RequestRecorder,
	{ readonly record: (request: RecordedRequest) => void }
>()("@voila.dev/http/RequestRecorder") {}
