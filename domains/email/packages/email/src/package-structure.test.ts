import { describe, expect, it } from "bun:test";
import {
	type ContextPair,
	contextResolver,
	describeEdges,
	importEdges,
	listSourceFiles,
	staleEdges,
	undeclaredEdges,
} from "@voila.dev/effect-ddd/architecture";

// Four subdomains on a shared kernel. `message`, `access`, `ids` and `paging`
// are the kernel and import nothing; `sending` is the transport, `suppression`
// the list, `delivery` (the outbox and the log) uses both, and `inbound`
// reads the log to thread replies. Nothing imports `inbound`.

const ALLOWED: ReadonlyArray<ContextPair> = [
	["delivery", "access"],
	["delivery", "ids"],
	["delivery", "message"],
	["delivery", "paging"],
	["delivery", "sending"],
	["delivery", "suppression"],
	["inbound", "access"],
	["inbound", "delivery"],
	["inbound", "ids"],
	["inbound", "message"],
	["inbound", "paging"],
	["sending", "message"],
	["suppression", "access"],
	["suppression", "ids"],
	["suppression", "message"],
	["suppression", "paging"],
];

const ROOT_FILES = new Set([
	"index.ts",
	"package-structure.test.ts",
	"use-case-registry.ts",
	"use-case-registry.test.ts",
	"email-domain.test-helper.ts",
]);

const root = import.meta.dirname;
const edges = importEdges({
	root,
	files: listSourceFiles(root),
	contextOf: contextResolver(),
});
const internal = (context: string) => !ROOT_FILES.has(context);

describe("package structure", () => {
	it("keeps every dependency between subdomains on the written list", () => {
		expect(
			describeEdges(undeclaredEdges(edges, ALLOWED, internal)),
			"a new dependency between subdomains: add it to ALLOWED if it is deliberate, or invert it",
		).toStrictEqual([]);
	});

	it("keeps the list free of edges the code no longer has", () => {
		expect(staleEdges(edges, ALLOWED)).toStrictEqual([]);
	});
});
