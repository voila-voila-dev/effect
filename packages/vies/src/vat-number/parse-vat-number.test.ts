import { describe, expect, it } from "bun:test";
import { Option } from "effect";
import { parseVatNumber } from "./parse-vat-number.ts";

describe("parseVatNumber", () => {
	it("reads the country from the prefix, whatever the spacing and case", () => {
		expect(parseVatNumber("lu 2026.0743", "FR")).toEqual(
			Option.some({ countryCode: "LU", vatNumber: "20260743" }),
		);
		expect(parseVatNumber("FR40303265045", "LU")).toEqual(
			Option.some({ countryCode: "FR", vatNumber: "40303265045" }),
		);
	});

	it("reads Greece from its EL prefix", () => {
		expect(parseVatNumber("EL094014201", "FR")).toEqual(
			Option.some({ countryCode: "GR", vatNumber: "094014201" }),
		);
	});

	it("reads a number typed without its prefix under the fallback country", () => {
		expect(parseVatNumber("20260743", "LU")).toEqual(
			Option.some({ countryCode: "LU", vatNumber: "20260743" }),
		);
		expect(parseVatNumber("094014201", "GR")).toEqual(
			Option.some({ countryCode: "GR", vatNumber: "094014201" }),
		);
	});

	it("refuses a country VIES does not answer for", () => {
		expect(parseVatNumber("CHE123456789", "FR")).toEqual(Option.none());
		expect(parseVatNumber("GB123456789", "FR")).toEqual(Option.none());
		expect(parseVatNumber("123456789", "CH")).toEqual(Option.none());
		expect(parseVatNumber("123456789", null)).toEqual(Option.none());
		expect(parseVatNumber("LU", "LU")).toEqual(Option.none());
	});

	it("refuses a number whose shape the member state never issues, without asking VIES", () => {
		expect(parseVatNumber("LU2026", "LU")).toEqual(Option.none());
		expect(parseVatNumber("FR123", "FR")).toEqual(Option.none());
	});
});
