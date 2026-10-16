import { describe, expect, it } from "bun:test";
import { readBoundedBytes } from "./read-bounded-bytes.ts";

function streamOf(chunks: ReadonlyArray<string>) {
	let cancelled = false;
	const encoder = new TextEncoder();
	let index = 0;
	const body = new ReadableStream<Uint8Array>({
		pull(controller) {
			const chunk = chunks[index++];
			if (chunk === undefined) controller.close();
			else controller.enqueue(encoder.encode(chunk));
		},
		cancel() {
			cancelled = true;
		},
	});
	return { response: new Response(body), cancelled: () => cancelled };
}

describe("readBoundedBytes", () => {
	it("reads a body within the bound, across chunks", async () => {
		const { response } = streamOf(["hello ", "world"]);

		const bytes = await readBoundedBytes(response, 11);

		expect(new TextDecoder().decode(bytes ?? new Uint8Array())).toBe(
			"hello world",
		);
	});

	it("stops at the bound and cancels the stream", async () => {
		const { response, cancelled } = streamOf(["hello ", "world", "!"]);

		expect(await readBoundedBytes(response, 8)).toBeNull();
		expect(cancelled()).toBe(true);
	});

	it("reads an absent body as empty", async () => {
		const bytes = await readBoundedBytes(
			new Response(null, { status: 204 }),
			10,
		);

		expect(bytes?.byteLength).toBe(0);
	});
});
