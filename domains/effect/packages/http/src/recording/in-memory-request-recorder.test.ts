import { describe, expect, it } from "bun:test";
import { DateTime, Effect } from "effect";
import { inMemoryRequestRecorder } from "./in-memory-request-recorder.ts";
import type { RecordedRequest } from "./recorded-request.ts";
import { RequestRecorder } from "./request-recorder.ts";

const request: RecordedRequest = {
	id: "0001",
	partner: "acme",
	method: "GET",
	host: "api.acme.test",
	path: "/",
	status: 200,
	outcome: "succeeded",
	durationMilliseconds: 12,
	failure: null,
	providerRequestId: null,
	startedAt: DateTime.makeUnsafe("2026-01-01T00:00:00Z"),
};

describe("inMemoryRequestRecorder", () => {
	it("keeps what is recorded through its layer", async () => {
		const memory = inMemoryRequestRecorder();

		await Effect.runPromise(
			Effect.flatMap(RequestRecorder, (recorder) =>
				Effect.sync(() => recorder.record(request)),
			).pipe(Effect.provide(memory.layer)),
		);

		expect(memory.requests).toEqual([request]);
	});

	it("starts empty, each instance on its own", () => {
		inMemoryRequestRecorder().recorder.record(request);

		expect(inMemoryRequestRecorder().requests).toEqual([]);
	});
});
