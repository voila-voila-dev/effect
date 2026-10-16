import { Effect, Layer } from "effect";
import { OutboundFetch } from "../fetch/outbound-fetch.ts";
import { type RecordingOptions, recordingFetch } from "./recording-fetch.ts";
import { RequestRecorder } from "./request-recorder.ts";

/**
 * Provides {@link OutboundFetch} with a `fetch` that records every request
 * through the {@link RequestRecorder} in context. `optionsFor` tunes a
 * partner: one whose error bodies are unsafe to read, one with a secret path.
 */
export function recordingFetchLayer(
	optionsFor: (partner: string) => RecordingOptions = () => ({}),
) {
	return Layer.effect(
		OutboundFetch,
		Effect.map(
			RequestRecorder,
			(recorder) => (partner: string) =>
				recordingFetch(partner, recorder, optionsFor(partner)),
		),
	);
}
