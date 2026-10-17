import { describe, expect, it } from "bun:test";
import { fixtureOptions, projects } from "./fixtures.test-helper.ts";
import { toApiReference } from "./model.ts";
const reference = toApiReference(projects, fixtureOptions);
function operation(slug) {
    const found = reference.operations.find((candidate) => candidate.slug === slug);
    if (!found) {
        throw new Error(`no operation ${slug}`);
    }
    return found;
}
function property(node, name) {
    const found = node?.kind === "object"
        ? node.properties.find((candidate) => candidate.name === name)
        : undefined;
    if (!found) {
        throw new Error(`no property ${name}`);
    }
    return found.schema;
}
describe("toApiReference", () => {
    it("groups operations under their tag, in the document's order", () => {
        expect(reference.tags.map((tag) => tag.slug)).toEqual(["projects"]);
        expect(reference.operations.map((entry) => entry.href)).toEqual([
            "/docs/api/projects/list",
            "/docs/api/projects/get",
            "/docs/api/projects/create",
            "/docs/api/projects/update",
            "/docs/api/projects/delete",
        ]);
    });
    it("carries the method, path, summary and description", () => {
        const list = operation("list");
        expect(list.method).toBe("post");
        expect(list.path).toBe("/projects/list");
        expect(list.summary).toBe("Search the project catalog");
        expect(list.description).toContain("no session is required");
    });
    it("resolves $ref components and names them without the Encoded suffix", () => {
        const items = property(operation("list").responses[0]?.body?.schema, "items");
        expect(items.kind).toBe("array");
        expect(items.kind === "array" && items.items.name).toBe("Project");
        expect(items.kind === "array" && items.items.kind === "object"
            ? items.items.properties.map((entry) => entry.name)
            : []).toContain("teams");
    });
    it("folds a nullable union into its one meaningful variant", () => {
        const filter = property(operation("list").requestBody?.schema, "filter");
        const search = property(filter, "search");
        expect(search).toMatchObject({
            kind: "scalar",
            type: "string",
            nullable: true,
            constraints: { maxLength: 128 },
        });
    });
    it("reads Effect's number encoding as a plain number", () => {
        const total = property(operation("list").responses[0]?.body?.schema, "total");
        expect(total).toMatchObject({ kind: "scalar", type: "number" });
    });
    it("marks required properties and keeps the enum values", () => {
        const body = operation("create").requestBody?.schema;
        const labels = property(body, "labels");
        expect(body?.kind === "object"
            ? body.properties.filter((entry) => entry.required).length
            : 0).toBe(5);
        expect(labels.kind === "array" && labels.items.kind === "scalar"
            ? labels.items.enum
            : []).toContain("mobile");
    });
    it("lists the header parameters and every response status", () => {
        const create = operation("create");
        expect(create.parameters).toMatchObject([
            { name: "authorization", location: "header", required: true },
        ]);
        expect(create.responses.map((response) => response.status)).toEqual([
            "200",
            "401",
            "403",
            "409",
            "500",
        ]);
        expect(operation("delete").responses[0]).toEqual({
            status: "204",
            description: "<No Content>",
        });
    });
    it("stops at a component that contains itself", () => {
        const tree = toApiReference({
            openapi: "3.1.0",
            info: { title: "Tree", version: "1" },
            paths: {
                "/nodes/get": {
                    post: {
                        operationId: "nodes.get",
                        responses: {
                            200: {
                                description: "Success",
                                content: {
                                    "application/json": {
                                        schema: { $ref: "#/components/schemas/NodeEncoded" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            components: {
                schemas: {
                    NodeEncoded: {
                        type: "object",
                        properties: {
                            children: {
                                type: "array",
                                items: { $ref: "#/components/schemas/NodeEncoded" },
                            },
                        },
                    },
                },
            },
        }, fixtureOptions);
        const children = property(tree.operations[0]?.responses[0]?.body?.schema, "children");
        expect(children.kind === "array" && children.items).toEqual({
            kind: "recursive",
            name: "Node",
            nullable: false,
        });
    });
    it("rejects a document that is not OpenAPI 3", () => {
        expect(() => toApiReference({ swagger: "2.0" }, fixtureOptions)).toThrow();
    });
});
