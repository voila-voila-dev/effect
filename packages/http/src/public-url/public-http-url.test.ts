import { describe, expect, it } from "bun:test";
import { hostTable } from "./host-table.test-helper.ts";
import { resolvePublicHttpUrl } from "./public-http-url.ts";

const resolve = hostTable({
	"images.example.test": ["93.184.216.34"],
	"internal.example.test": ["10.0.0.4"],
	"split.example.test": ["93.184.216.34", "127.0.0.1"],
});

describe("resolvePublicHttpUrl", () => {
	it.each([
		"ftp://93.184.216.34/file",
		"http://93.184.216.34:8080/odd-port",
		"http://user:pass@93.184.216.34/credentials",
		"http://10.0.0.4/private",
		"http://[::1]/loopback",
		"http://internal.example.test/",
		"http://split.example.test/",
		"http://unknown.example.test/",
		"not a url",
	])("refuses %s", async (rawUrl) => {
		expect(await resolvePublicHttpUrl(rawUrl, resolve)).toBeNull();
	});

	it("accepts a public https address on the default port", async () => {
		const url = await resolvePublicHttpUrl(
			"https://93.184.216.34/logo.png",
			resolve,
		);
		expect(url?.hostname).toBe("93.184.216.34");
	});

	it("accepts a hostname resolving only to public addresses", async () => {
		const url = await resolvePublicHttpUrl(
			"https://images.example.test/logo.png",
			resolve,
		);
		expect(url?.pathname).toBe("/logo.png");
	});
});
