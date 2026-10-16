import { describe, expect, it } from "bun:test";
import { publicKeyFromPem } from "./certificate-public-key.ts";
import { testCertificate } from "./test-certificate.test-helper.ts";

const certificate = await testCertificate();

describe("publicKeyFromPem", () => {
	it("reads the public key out of a certificate", () => {
		expect(publicKeyFromPem(certificate.certificatePem)).toEqual(
			new Uint8Array(certificate.spki),
		);
	});

	it("takes a bare public key as it is", () => {
		expect(publicKeyFromPem(certificate.publicKeyPem)).toEqual(
			new Uint8Array(certificate.spki),
		);
	});

	it("throws on anything else", () => {
		expect(() => publicKeyFromPem("not a pem")).toThrow();
		expect(() =>
			publicKeyFromPem(
				"-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----",
			),
		).toThrow();
	});
});
