import {
	type Applicability,
	type ContextMismatch,
	contextMismatches,
	type ReaderContext,
	type ReaderDimensions,
	readerContextFromQuery,
	readerContextOf,
} from "@voila.dev/docs/reader-context";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { useStoredChoice } from "../lib/stored-choice.ts";
import { type DocsReaderDimensionView, useDocs } from "./docs-provider.tsx";
import { DocsSelect } from "./docs-select.tsx";

function dimensionsOf(
	views: ReadonlyArray<DocsReaderDimensionView>,
): ReaderDimensions {
	return Object.fromEntries(
		views.map((view) => {
			const [first, ...others] = view.options;
			return [
				view.name,
				{
					values: [first.value, ...others.map((option) => option.value)],
					audiences: view.audiences,
					queryParameter: view.queryParameter,
				},
			];
		}),
	);
}

function parsed(stored: string | undefined): unknown {
	try {
		return stored === undefined ? undefined : JSON.parse(stored);
	} catch {
		return undefined;
	}
}

function sameContext(left: ReaderContext, right: ReaderContext): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * The reader's answers, remembered on this device. The prerendered page and
 * the first client render know none, so every variant ships in the HTML.
 */
export function useReaderContext() {
	const { readerContext, messages } = useDocs();
	const [stored, store] = useStoredChoice(readerContext.storageKey);
	const dimensions = dimensionsOf(readerContext.dimensions);
	const context = readerContextOf(dimensions, parsed(stored));

	function replace(next: ReaderContext) {
		store(JSON.stringify(next));
	}

	function choose(name: string, value: string | undefined) {
		const { [name]: _, ...others } = context;
		replace(value === undefined ? others : { ...others, [name]: value });
	}

	function restrictionLabel(
		restrictions: ReadonlyArray<ContextMismatch>,
	): string {
		return restrictions
			.flatMap(({ dimension, values }) => {
				const view = readerContext.dimensions.find(
					(each) => each.name === dimension,
				);
				if (!view) {
					return [];
				}
				const labels = values.map(
					(value) =>
						view.options.find((option) => option.value === value)?.label ??
						value,
				);
				return [
					messages.readerContext.restriction(
						view.shortLabel,
						labels.join(", "),
					),
				];
			})
			.join(" · ");
	}

	/** Why the page at `href` is not written for this reader, or undefined when it is. */
	function reasonFor(href: string): string | undefined {
		const mismatches = contextMismatches(
			readerContext.applicability[href.split("#")[0] ?? href],
			context,
		);
		return mismatches.length > 0
			? messages.readerContext.notForYou(restrictionLabel(mismatches))
			: undefined;
	}

	/** Whether a passage written for `appliesTo` is for this reader: always, until they answer. */
	function matches(appliesTo: Applicability): boolean {
		return contextMismatches(appliesTo, context).length === 0;
	}

	function restrictionsOf(appliesTo: Applicability): Array<ContextMismatch> {
		return Object.entries(appliesTo).flatMap(([dimension, values]) =>
			values ? [{ dimension, values }] : [],
		);
	}

	return {
		dimensions,
		views: readerContext.dimensions,
		context,
		choose,
		replace,
		restrictionLabel,
		reasonFor,
		matches,
		restrictionsOf,
	};
}

/**
 * Adopts the context a link carries (`?country=FR&language=fr`, from support for
 * instance). It never writes the context back into the address: rewriting the
 * history entry behind the router during a click made the router drop the
 * navigation, and a query names no page of its own for search engines.
 */
export function ReaderContextAddress() {
	const { navigation } = useDocs();
	const { dimensions, context, replace } = useReaderContext();
	const { pathname } = navigation;
	const adoptedOn = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (adoptedOn.current === pathname) {
			return;
		}
		adoptedOn.current = pathname;
		const linked = readerContextFromQuery(
			dimensions,
			new URLSearchParams(window.location.search),
		);
		const next = { ...context, ...linked };
		if (!sameContext(next, context)) {
			replace(next);
		}
	});

	return null;
}

/** One select per dimension the audience is asked, after the page's own questions (`children`). */
export function ReaderContextPicker({
	audience,
	compact = false,
	children,
}: {
	audience: string;
	compact?: boolean;
	children?: ReactNode;
}) {
	const { messages } = useDocs();
	const { views, context, choose } = useReaderContext();
	const id = useId();
	const asked = views.filter((view) => view.audiences.includes(audience));
	if (asked.length === 0) {
		return null;
	}
	return (
		<fieldset
			className={
				compact
					? "grid gap-2.5"
					: "grid gap-x-4 gap-y-3 rounded-2xl border border-border bg-foreground/[0.02] p-4 sm:grid-cols-2"
			}
		>
			<legend className="sr-only">{messages.readerContext.title}</legend>
			{children}
			{asked.map((view) => (
				<DocsSelect
					key={view.name}
					id={`${id}-${view.name}`}
					label={view.label}
					value={context[view.name] ?? ""}
					options={view.options}
					unsetLabel={messages.readerContext.unset}
					onChange={(value) => choose(view.name, value)}
					compact={compact}
				/>
			))}
			{compact ? null : (
				<p className="text-muted-foreground text-xs leading-5 sm:col-span-2">
					{messages.readerContext.hint}
				</p>
			)}
		</fieldset>
	);
}
