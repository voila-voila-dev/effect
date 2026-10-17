import { describe, expect, it } from "bun:test";
import { contextCombinations, contextMismatches, dimensionsFor, readerContextFromQuery, readerContextOf, } from "./reader-context.ts";
const dimensions = {
    country: {
        values: ["FR", "LU"],
        audiences: ["teams", "developers"],
        queryParameter: "country",
    },
    language: {
        values: ["en", "other"],
        audiences: ["developers"],
        queryParameter: "language",
    },
};
describe("dimensionsFor", () => {
    it("asks developers both dimensions and teams their own", () => {
        expect(dimensionsFor(dimensions, "developers")).toEqual([
            "country",
            "language",
        ]);
        expect(dimensionsFor(dimensions, "teams")).toEqual(["country"]);
        expect(dimensionsFor(dimensions, "account")).toEqual([]);
    });
});
describe("contextMismatches", () => {
    const luxembourg = { country: ["LU"] };
    it("rules a page out on the dimension the reader answered otherwise", () => {
        expect(contextMismatches(luxembourg, {
            country: "FR",
            language: "en",
        })).toEqual([{ dimension: "country", values: ["LU"] }]);
    });
    it("keeps a page for a reader who has not answered", () => {
        expect(contextMismatches(luxembourg, {})).toEqual([]);
        expect(contextMismatches(luxembourg, { language: "other" })).toEqual([]);
    });
    it("keeps a page written for every context", () => {
        expect(contextMismatches(undefined, { country: "LU" })).toEqual([]);
    });
});
describe("readerContextOf", () => {
    it("drops unknown dimensions and values", () => {
        expect(readerContextOf(dimensions, {
            country: "BE",
            language: "other",
            theme: "dark",
        })).toEqual({ language: "other" });
    });
    it("reads nothing from what is not an object", () => {
        expect(readerContextOf(dimensions, "FR")).toEqual({});
        expect(readerContextOf(dimensions, null)).toEqual({});
    });
});
describe("the context in a link", () => {
    it("reads the dimensions from their parameters", () => {
        expect(readerContextFromQuery(dimensions, new URLSearchParams("country=LU&language=other&path=x"))).toEqual({ country: "LU", language: "other" });
    });
    it("ignores a value the site does not declare", () => {
        expect(readerContextFromQuery(dimensions, new URLSearchParams("country=XX"))).toEqual({});
    });
});
describe("contextCombinations", () => {
    it("crosses the values of the dimensions an audience is asked", () => {
        expect(contextCombinations(dimensions, "developers")).toEqual([
            { country: "FR", language: "en" },
            { country: "FR", language: "other" },
            { country: "LU", language: "en" },
            { country: "LU", language: "other" },
        ]);
        expect(contextCombinations(dimensions, "teams")).toEqual([
            { country: "FR" },
            { country: "LU" },
        ]);
    });
});
