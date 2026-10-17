import { describe, expect, it } from "bun:test";
import { searchDocs } from "./search.ts";
const entries = [
    {
        kind: "page",
        title: "Send an invoice",
        context: "Teams",
        href: "/docs/teams/send-an-invoice",
        keywords: "Get paid by a customer",
    },
    {
        kind: "section",
        title: "The three steps",
        context: "Send an invoice",
        href: "/docs/teams/send-an-invoice#the-three-steps",
    },
    {
        kind: "page",
        title: "Pay an invoice in Zürich",
        context: "Customers",
        href: "/docs/customers/pay-an-invoice",
    },
    {
        kind: "operation",
        title: "Search the project catalog",
        context: "/projects/list",
        href: "/docs/api/projects/list",
        method: "post",
    },
];
function titles(query) {
    return searchDocs(entries, query).map((result) => result.title);
}
describe("searchDocs", () => {
    it("returns nothing for a blank query", () => {
        expect(titles("  ")).toEqual([]);
    });
    it("ignores accents and case", () => {
        expect(titles("THREE")).toEqual(["The three steps"]);
        expect(titles("in zurich")).toEqual(["Pay an invoice in Zürich"]);
    });
    it("ranks a title prefix above a match in the context", () => {
        expect(titles("send")).toEqual(["Send an invoice", "The three steps"]);
    });
    it("requires every word to match somewhere", () => {
        expect(titles("invoice rugby")).toEqual([]);
        expect(titles("invoice customer")).toEqual([
            "Send an invoice",
            "Pay an invoice in Zürich",
        ]);
    });
    it("tolerates a skipped letter in a title", () => {
        expect(titles("zurch")).toEqual(["Pay an invoice in Zürich"]);
    });
    it("finds an operation by its verb or path", () => {
        expect(titles("post projects")).toEqual(["Search the project catalog"]);
    });
    it("matches the chips a page carries", () => {
        expect(searchDocs([
            ...entries,
            {
                kind: "page",
                title: "Get paid",
                context: "Developers",
                href: "/docs/developers/payouts",
                tags: ["Developer", "Money and documents"],
            },
        ], "paid money").map((result) => result.title)).toEqual(["Get paid"]);
    });
});
describe("searchDocs with synonyms", () => {
    const guides = [
        {
            kind: "page",
            title: "Report the owner’s draw",
            context: "Admin",
            href: "/docs/pro/report",
        },
        {
            kind: "page",
            title: "Set up a sole proprietorship",
            context: "Getting started",
            href: "/docs/pro/sole",
        },
        {
            kind: "page",
            title: "Add your IBAN",
            context: "Get verified",
            href: "/docs/pro/iban",
        },
        {
            kind: "page",
            title: "Physiotherapist on payroll",
            context: "Paths",
            href: "/docs/pro/physio",
        },
    ];
    const synonyms = [
        ["freelancer", "sole proprietorship", "sole trader"],
        ["OD", "owner’s draw"],
        ["physio", "physiotherapist"],
        ["BIC", "IBAN"],
    ];
    function first(query) {
        return searchDocs(guides, query, { synonyms })[0]?.title;
    }
    it("finds a page through a word the page never uses", () => {
        expect(first("freelancer")).toBe("Set up a sole proprietorship");
        expect(first("bic")).toBe("Add your IBAN");
        expect(first("physio payroll")).toBe("Physiotherapist on payroll");
    });
    it("reads a synonym of several words as one term", () => {
        expect(first("report OD")).toBe("Report the owner’s draw");
        expect(first("owner's draw")).toBe("Report the owner’s draw");
    });
    it("leaves the query alone without synonyms", () => {
        expect(searchDocs(guides, "od")).toEqual([]);
    });
});
