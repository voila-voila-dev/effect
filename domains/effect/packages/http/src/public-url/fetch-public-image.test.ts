import { describe, expect, it } from "bun:test";
import { fakeFetch } from "../fetch/fake-fetch.test-helper.ts";
import { fetchPublicImage } from "./fetch-public-image.ts";
import { hostTable } from "./host-table.test-helper.ts";

const PUBLIC_URL = new URL("http://93.184.216.34/logo.png");

function image(respond: () => Response, maxBytes = 1024) {
	const stub = fakeFetch(respond);
	return fetchPublicImage(PUBLIC_URL, {
		timeoutMilliseconds: 1000,
		maxBytes,
		fetch: stub.fetch,
		resolveHost: hostTable({}),
	});
}

describe("fetchPublicImage", () => {
	it("returns the bytes and the declared image type", async () => {
		const result = await image(
			() =>
				new Response("png-bytes", {
					headers: { "content-type": "image/png; charset=binary" },
				}),
		);

		expect(result?.mimeType).toBe("image/png");
		expect(new TextDecoder().decode(result?.bytes)).toBe("png-bytes");
	});

	it("keeps anything not declared as an image as opaque bytes", async () => {
		const result = await image(
			() =>
				new Response("<html></html>", {
					headers: { "content-type": "text/html" },
				}),
		);

		expect(result?.mimeType).toBe("application/octet-stream");
	});

	it("returns null on a failed answer, an empty body, or one over the bound", async () => {
		expect(await image(() => new Response(null, { status: 500 }))).toBeNull();
		expect(await image(() => new Response(""))).toBeNull();
		expect(await image(() => new Response("x".repeat(2048)), 10)).toBeNull();
	});
});
