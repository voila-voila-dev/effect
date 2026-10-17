import { describe, expect, it } from "bun:test";
import { fakeFetch } from "../fetch/fake-fetch.test-helper.ts";
import { fetchPublicUrl } from "./fetch-public-url.ts";
import { hostTable } from "./host-table.test-helper.ts";

const PUBLIC_URL = "http://93.184.216.34/logo.png";
const OPTIONS = { timeoutMilliseconds: 1000, resolveHost: hostTable({}) };

function redirect(location: string) {
	return new Response(null, { status: 302, headers: { location } });
}

describe("fetchPublicUrl", () => {
	it("fetches a public URL without following redirects blindly", async () => {
		const stub = fakeFetch(() => new Response("png-bytes"));

		const response = await fetchPublicUrl(PUBLIC_URL, {
			...OPTIONS,
			headers: { accept: "image/*" },
			fetch: stub.fetch,
		});

		expect(await response?.text()).toBe("png-bytes");
		expect(stub.calls[0]?.url).toBe(PUBLIC_URL);
		expect(stub.calls[0]?.init.redirect).toBe("manual");
		expect(new Headers(stub.calls[0]?.init.headers).get("accept")).toBe(
			"image/*",
		);
	});

	it("follows a redirect through the guard to a public target", async () => {
		const stub = fakeFetch((url) =>
			url === PUBLIC_URL
				? redirect("http://93.184.216.35/moved.png")
				: new Response("moved"),
		);

		const response = await fetchPublicUrl(PUBLIC_URL, {
			...OPTIONS,
			fetch: stub.fetch,
		});

		expect(await response?.text()).toBe("moved");
		expect(stub.calls.map((call) => call.url)).toEqual([
			PUBLIC_URL,
			"http://93.184.216.35/moved.png",
		]);
	});

	it("refuses a private URL without fetching it", async () => {
		const stub = fakeFetch(() => new Response("never"));

		expect(
			await fetchPublicUrl("http://127.0.0.1/admin", {
				...OPTIONS,
				fetch: stub.fetch,
			}),
		).toBeNull();
		expect(stub.calls).toHaveLength(0);
	});

	it("refuses a redirect into a private range", async () => {
		const stub = fakeFetch(() => redirect("http://169.254.169.254/meta-data"));

		expect(
			await fetchPublicUrl(PUBLIC_URL, { ...OPTIONS, fetch: stub.fetch }),
		).toBeNull();
		expect(stub.calls.map((call) => call.url)).toEqual([PUBLIC_URL]);
	});

	it("gives up after three redirects", async () => {
		const stub = fakeFetch((url) => {
			const hop = Number(url.slice(-1));
			return redirect(`http://93.184.216.34/${hop + 1}`);
		});

		expect(
			await fetchPublicUrl("http://93.184.216.34/0", {
				...OPTIONS,
				fetch: stub.fetch,
			}),
		).toBeNull();
		expect(stub.calls).toHaveLength(4);
	});

	it("turns a transport failure into null", async () => {
		const stub = fakeFetch(() => {
			throw new Error("connection refused");
		});

		expect(
			await fetchPublicUrl(PUBLIC_URL, { ...OPTIONS, fetch: stub.fetch }),
		).toBeNull();
	});
});
