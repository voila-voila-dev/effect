import { Layer } from "effect";
import type { RecordedRequest } from "./recorded-request.ts";
import { RequestRecorder } from "./request-recorder.ts";

/**
 * A {@link RequestRecorder} keeping every request in an array, for tests and
 * scripts. `layer` provides it; `requests` is what it recorded so far.
 */
export function inMemoryRequestRecorder(): {
	readonly requests: ReadonlyArray<RecordedRequest>;
	readonly recorder: RequestRecorder["Service"];
	readonly layer: Layer.Layer<RequestRecorder>;
} {
	const requests: Array<RecordedRequest> = [];
	const recorder: RequestRecorder["Service"] = {
		record: (request) => {
			requests.push(request);
		},
	};
	return {
		requests,
		recorder,
		layer: Layer.succeed(RequestRecorder, recorder),
	};
}
