import { CaretRightIcon } from "@phosphor-icons/react";
import {
	constraintEntries,
	type SchemaNode,
	type SchemaProperty,
} from "@voila.dev/docs/api-reference/schema-node";
import { Chip } from "../chip.tsx";
import { useDocs } from "../docs-provider.tsx";

type ByKind<Result> = {
	[Kind in SchemaNode["kind"]]: (
		node: Extract<SchemaNode, { kind: Kind }>,
	) => Result;
};

function dispatch<Result>(table: ByKind<Result>, node: SchemaNode): Result {
	return dispatchKind(table, node.kind, node);
}

/** The generic kind pairs the table's entry with the node it is called with. */
function dispatchKind<Result, Kind extends SchemaNode["kind"]>(
	table: ByKind<Result>,
	kind: Kind,
	node: Extract<SchemaNode, { kind: Kind }>,
): Result {
	return table[kind](node);
}

function scalarLabel(node: Extract<SchemaNode, { kind: "scalar" }>): string {
	const type = node.format ? `${node.type}<${node.format}>` : node.type;
	return node.enum ? `enum<${type}>` : type;
}

const TYPE_LABELS: ByKind<string> = {
	object: (node) => node.name ?? "object",
	array: (node) => `${typeLabel(node.items)}[]`,
	union: (node) => node.variants.map(typeLabel).join(" | "),
	scalar: scalarLabel,
	recursive: (node) => node.name ?? "object",
	any: () => "any",
};

function typeLabel(node: SchemaNode): string {
	return dispatch(TYPE_LABELS, node);
}

function noChildren(): ReadonlyArray<SchemaProperty> {
	return [];
}

const CHILDREN: ByKind<ReadonlyArray<SchemaProperty>> = {
	object: (node) => node.properties,
	array: (node) => childrenOf(node.items),
	union: noChildren,
	scalar: noChildren,
	recursive: noChildren,
	any: noChildren,
};

/** What a field opens onto: an object's properties, through the arrays around it. */
function childrenOf(node: SchemaNode): ReadonlyArray<SchemaProperty> {
	return dispatch(CHILDREN, node);
}

function leafOf(node: SchemaNode): SchemaNode {
	return node.kind === "array" ? leafOf(node.items) : node;
}

function FieldFacts({ node }: { node: SchemaNode }) {
	const { messages } = useDocs();
	const leaf = leafOf(node);
	const constraints =
		leaf.kind === "scalar" ? constraintEntries(leaf.constraints) : [];
	const variants =
		leaf.kind === "union"
			? leaf.variants.filter((variant) => variant.name)
			: [];
	return (
		<>
			{node.description ? (
				<p className="mt-3 text-foreground/75 leading-7">{node.description}</p>
			) : null}
			{leaf.kind === "scalar" && leaf.enum && leaf.enum.length > 1 ? (
				<p className="mt-3 flex flex-wrap items-center gap-1.5 text-docs-sm text-muted-foreground">
					{messages.api.allowedValues}
					{leaf.enum.map((value) => (
						<Chip key={String(value)}>{JSON.stringify(value)}</Chip>
					))}
				</p>
			) : null}
			{constraints.length > 0 ? (
				<p className="mt-3 flex flex-wrap gap-1.5">
					{constraints.map(([keyword, value]) => (
						<Chip key={keyword}>
							{messages.api.constraints[keyword](value)}
						</Chip>
					))}
				</p>
			) : null}
			{variants.length > 0 ? (
				<p className="mt-3 flex flex-wrap items-center gap-1.5 text-docs-sm text-muted-foreground">
					{messages.api.variants}
					{variants.map((variant) => (
						<Chip key={variant.name}>{variant.name}</Chip>
					))}
				</p>
			) : null}
		</>
	);
}

function FieldRow({
	name,
	node,
	required,
	depth = 0,
}: {
	name?: string;
	node: SchemaNode;
	required: boolean;
	depth?: number;
}) {
	const { messages } = useDocs();
	const children = childrenOf(node);
	return (
		<li className="py-6 first:pt-0 last:pb-0">
			<div className="flex flex-wrap items-center gap-2">
				{name ? (
					<code className="font-medium font-mono text-docs-sm text-foreground">
						{name}
					</code>
				) : null}
				<Chip>{typeLabel(node)}</Chip>
				{node.nullable ? <Chip>{messages.api.nullable}</Chip> : null}
				{required ? <Chip tone="red">{messages.api.required}</Chip> : null}
			</div>
			<FieldFacts node={node} />
			{children.length > 0 ? (
				<details
					className="group/fields mt-4 rounded-xl border border-border"
					open={depth === 0 && children.length <= 4}
				>
					<summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 font-medium text-docs-sm text-foreground/75 hover:text-foreground [&::-webkit-details-marker]:hidden">
						<CaretRightIcon
							className="size-3 transition-transform group-open/fields:rotate-90"
							weight="bold"
							aria-hidden
						/>
						{messages.api.childFields(children.length)}
					</summary>
					<div className="border-border border-t px-4 py-5">
						<FieldList properties={children} depth={depth + 1} />
					</div>
				</details>
			) : null}
		</li>
	);
}

function FieldList({
	properties,
	depth = 0,
}: {
	properties: ReadonlyArray<SchemaProperty>;
	depth?: number;
}) {
	return (
		<ul className="divide-y divide-border">
			{properties.map((property) => (
				<FieldRow
					key={property.name}
					name={property.name}
					node={property.schema}
					required={property.required}
					depth={depth}
				/>
			))}
		</ul>
	);
}

/** A body: its fields when it is an object, else one row naming its type. */
export function SchemaFields({ node }: { node: SchemaNode }) {
	if (node.kind === "object") {
		return <FieldList properties={node.properties} />;
	}
	return (
		<ul>
			<FieldRow node={node} required={false} />
		</ul>
	);
}
