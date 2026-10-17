import { describe, expect, it } from "bun:test";
import { locate, navigationCoverage, navigationTopics, resolveNavigation, } from "./navigation.ts";
const pages = new Map(["a", "b", "c"].map((slug) => [
    slug,
    { title: slug.toUpperCase(), href: `/docs/${slug}` },
]));
const tabs = resolveNavigation([
    {
        label: "Guides",
        groups: [
            {
                label: "Getting started",
                pages: ["a", { label: "Folder", pages: ["b"] }, "c"],
            },
        ],
    },
], pages, []);
describe("locate", () => {
    it("finds a page inside a folder, with the folders above it", () => {
        const location = locate(tabs, "/docs/b");
        expect(location?.group.label).toBe("Getting started");
        expect(location?.folders.map((folder) => folder.label)).toEqual(["Folder"]);
        expect(location?.previous?.href).toBe("/docs/a");
        expect(location?.next?.href).toBe("/docs/c");
    });
    it("opens a tab on its first page, even inside a folder", () => {
        expect(tabs[0]?.href).toBe("/docs/a");
        expect(locate(tabs, "/docs/c")?.folders).toEqual([]);
    });
});
describe("resolveNavigation", () => {
    const audienceTabs = resolveNavigation([
        {
            label: "Guides",
            audiences: [{ id: "dev", label: "Developers" }],
            groups: [
                { label: "Account", pages: ["a"] },
                { label: "Get started", audience: "dev", pages: ["b"] },
                { label: "Integrations", audience: "dev", pages: ["c"] },
            ],
        },
    ], new Map([
        ["a", { title: "A", href: "/docs/a" }],
        ["b", { title: "B", href: "/docs/b" }],
        [
            "c",
            {
                title: "Connect an integration",
                sidebarTitle: "Connect",
                href: "/docs/c",
            },
        ],
    ]), []);
    it("opens an audience on the first page of its first group", () => {
        expect(audienceTabs[0]?.audiences).toEqual([
            { id: "dev", label: "Developers", href: "/docs/b" },
        ]);
    });
    it("locates a topic's page with its audience", () => {
        const location = locate(audienceTabs, "/docs/c");
        expect(location?.group.label).toBe("Integrations");
        expect(location?.audience?.label).toBe("Developers");
        expect(location?.item.sidebarTitle).toBe("Connect");
    });
    it("refuses a group whose audience its tab does not declare", () => {
        expect(() => resolveNavigation([
            {
                label: "Guides",
                groups: [{ label: "Integrations", audience: "dev", pages: ["a"] }],
            },
        ], pages, [])).toThrow('the group "Integrations" names the audience "dev", which its tab\'s audiences do not declare');
    });
});
describe("navigationTopics", () => {
    it("lists each group with its own pages, its folders left to the sidebar", () => {
        expect(navigationTopics([
            {
                label: "Guides",
                groups: [
                    { label: "A", pages: ["a", { label: "F", pages: ["b"] }, "c"] },
                ],
            },
            { label: "API", apiReference: true },
        ])).toEqual([{ label: "A", slugs: ["a", "c"] }]);
    });
});
describe("navigationCoverage", () => {
    it("reports the unlisted, repeated and missing pages", () => {
        expect(navigationCoverage([
            {
                label: "Guides",
                groups: [
                    { label: "A", pages: ["a", { label: "F", pages: ["a", "x"] }] },
                ],
            },
            { label: "API", apiReference: true },
        ], ["a", "b"])).toEqual({ unlisted: ["b"], repeated: ["a"], missing: ["x"] });
    });
});
