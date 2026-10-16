import { describe, expect, it } from "bun:test";
import { Effect, Layer } from "effect";
import { fakeFetch } from "../fetch/fake-fetch.test-helper.ts";
import { sendOutbound } from "../request/send-outbound.ts";
import { inMemoryRequestRecorder } from "./in-memory-request-recorder.ts";
import { recordingFetchLayer } from "./recording-fetch-layer.ts";

describe("recordingFetchLayer", () => {
	it("records every outbound request through the recorder in context", async () => {
		const memory = inMemoryRequestRecorder();
		const partner = fakeFetch(() => new Response("{}"));
		const layer = recordingFetchLayer(() => ({ base: partner.fetch })).pipe(
			Layer.provide(memory.layer),
		);

		await Effect.runPromise(
			Effect.all([
				sendOutbound("acme", "https://api.acme.test/a"),
				sendOutbound("globex", "https://api.globex.test/b"),
			]).pipe(Effect.provide(layer)),
		);

		expect(memory.requests.map((request) => request.partner)).toEqual([
			"acme",
			"globex",
		]);
	});

	it("tunes each partner through its own options", async () => {
		const memory = inMemoryRequestRecorder();
		const partner = fakeFetch(() => new Response("key sk_1", { status: 401 }));
		const layer = recordingFetchLayer((name) => ({
			base: partner.fetch,
			readFailureBody: name !== "user-configured",
		})).pipe(Layer.provide(memory.layer));

		await Effect.runPromise(
			sendOutbound("user-configured", "https://hooks.example.test/").pipe(
				Effect.provide(layer),
			),
		);

		expect(memory.requests[0]?.failure).toBe("HTTP 401");
	});
});
