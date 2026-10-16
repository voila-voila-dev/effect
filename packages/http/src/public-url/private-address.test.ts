import { describe, expect, it } from "bun:test";
import { isPrivateAddress } from "./private-address.ts";

describe("isPrivateAddress", () => {
	it.each([
		"127.0.0.1",
		"10.1.2.3",
		"100.64.0.1",
		"169.254.169.254",
		"172.16.0.1",
		"192.168.1.1",
		"224.0.0.1",
		"::1",
		"fd12::1",
		"fe80::1",
		"::ffff:127.0.0.1",
		"::ffff:7f00:1",
		"64:ff9b::a9fe:a9fe",
		"2002:a9fe:a9fe::1",
		"2001:0:4136:e378::1",
		"2001:db8::1",
		"2001:10::1",
		"3fff::1",
		"ff02::1",
		"fec0::1",
		"::",
		"not-an-ip",
	])("refuses %s", (address) => {
		expect(isPrivateAddress(address)).toBe(true);
	});

	it.each([
		"93.184.216.34",
		"172.32.0.1",
		"100.128.0.1",
		"2606:2800::1",
		"2a00:1450:4007:80e::200e",
		"2001:4860:4860::8888",
		"::ffff:93.184.216.34",
	])("allows %s", (address) => {
		expect(isPrivateAddress(address)).toBe(false);
	});
});
