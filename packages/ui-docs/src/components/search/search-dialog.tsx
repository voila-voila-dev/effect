import { Dialog } from "@base-ui/react/dialog";
import {
	ArrowElbowDownLeftIcon,
	FileTextIcon,
	HashIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { type SearchEntry, searchDocs } from "@voila.dev/docs/search";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { cn } from "../../lib/cn.ts";
import { Chip, methodTone } from "../chip.tsx";
import { useDocs } from "../docs-provider.tsx";
import { useReaderContext } from "../reader-context.tsx";
import type { DocsSearchIndex } from "./docs-search.tsx";

const NO_SYNONYMS: ReadonlyArray<never> = [];

const KIND_ICONS = {
	page: FileTextIcon,
	section: HashIcon,
} as const;

function ResultIcon({ entry }: { entry: SearchEntry }) {
	if (entry.method) {
		return (
			<Chip
				tone={methodTone(entry.method)}
				size="xs"
				className="w-9 justify-center"
			>
				{entry.method}
			</Chip>
		);
	}
	const Icon = KIND_ICONS[entry.kind === "section" ? "section" : "page"];
	return (
		<span className="flex w-9 shrink-0 justify-center text-muted-foreground">
			<Icon className="size-4" aria-hidden />
		</span>
	);
}

const MOVES: Readonly<Record<string, number>> = { ArrowDown: 1, ArrowUp: -1 };

/** A result's title and where it sits, dimmed with the reason when it is written for another reader context. */
function ResultText({ entry }: { entry: SearchEntry }) {
	const { reasonFor } = useReaderContext();
	const reason = reasonFor(entry.href);
	return (
		<span className={cn("min-w-0 flex-1", reason && "opacity-60")}>
			<span className="block truncate font-medium text-docs-sm text-foreground">
				{entry.title}
			</span>
			<span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground text-xs">
				<span className="min-w-0 truncate">{entry.context}</span>
				{entry.tags?.map((tag) => (
					<Chip key={tag} className="font-sans">
						{tag}
					</Chip>
				))}
			</span>
			{reason ? (
				<span className="block truncate text-muted-foreground text-xs">
					{reason}
				</span>
			) : null}
		</span>
	);
}

export function SearchDialog({
	open,
	onOpenChange,
	entries,
	suggestions,
	synonyms = NO_SYNONYMS,
}: DocsSearchIndex & {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { navigate, messages } = useDocs();
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);
	const listId = useId();
	const list = useRef<HTMLDivElement>(null);
	const results: ReadonlyArray<SearchEntry> = query.trim()
		? searchDocs(entries, query, { synonyms })
		: suggestions;

	useEffect(() => {
		list.current
			?.querySelector("[data-active]")
			?.scrollIntoView({ block: "nearest" });
	});

	function go(entry: SearchEntry) {
		onOpenChange(false);
		setQuery("");
		navigate(entry.href);
	}

	function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		const move = MOVES[event.key];
		if (move !== undefined && results.length > 0) {
			event.preventDefault();
			setActive(
				(current) => (current + move + results.length) % results.length,
			);
		}
		const target = results[active];
		if (event.key === "Enter" && target) {
			event.preventDefault();
			go(target);
		}
	}

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
				<Dialog.Popup className="fixed top-14 left-1/2 z-50 flex max-h-[min(36rem,calc(100dvh-5rem))] w-[calc(100vw-2rem)] max-w-[40rem] -translate-x-1/2 flex-col rounded-2xl bg-background p-2 shadow-2xl outline-none ring-1 ring-foreground/5 transition duration-150 data-[ending-style]:scale-[0.98] data-[starting-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
					<Dialog.Title className="sr-only">
						{messages.searchTitle}
					</Dialog.Title>
					<div className="flex items-center gap-3 rounded-xl border border-border px-3.5">
						<MagnifyingGlassIcon
							className="size-4 shrink-0 text-muted-foreground"
							aria-hidden
						/>
						<input
							value={query}
							onChange={(event) => {
								setQuery(event.target.value);
								setActive(0);
							}}
							onKeyDown={onKeyDown}
							placeholder={messages.searchPlaceholder}
							role="combobox"
							aria-expanded
							aria-controls={listId}
							aria-activedescendant={
								results[active] ? `${listId}-${active}` : undefined
							}
							aria-autocomplete="list"
							autoComplete="off"
							spellCheck={false}
							className="h-12 min-w-0 flex-1 bg-transparent text-foreground text-lg outline-none placeholder:text-muted-foreground focus-visible:outline-none!"
						/>
					</div>
					{results.length === 0 ? (
						<p className="px-4 py-10 text-center text-docs-sm text-muted-foreground">
							{messages.searchEmpty(query.trim())}
						</p>
					) : (
						<div
							ref={list}
							id={listId}
							role="listbox"
							aria-label={messages.searchTitle}
							className="mt-2 overflow-y-auto"
						>
							{results.map((entry, index) => (
								// biome-ignore lint/a11y/useKeyWithClickEvents: the combobox input owns the keyboard (arrows and Enter).
								<div
									key={entry.href}
									tabIndex={-1}
									id={`${listId}-${index}`}
									role="option"
									aria-selected={index === active}
									data-active={index === active ? "" : undefined}
									onPointerMove={() => setActive(index)}
									onClick={() => go(entry)}
									className="group/option flex cursor-pointer items-center gap-2 rounded-xl p-2 data-[active]:bg-foreground/5"
								>
									<ResultIcon entry={entry} />
									<ResultText entry={entry} />
									<ArrowElbowDownLeftIcon
										className="mr-1 size-4 shrink-0 text-muted-foreground opacity-0 group-data-[active]/option:opacity-100"
										aria-hidden
									/>
								</div>
							))}
						</div>
					)}
					<div className="mt-2 hidden items-center gap-4 border-border border-t px-2 pt-2.5 pb-1 text-muted-foreground text-xs sm:flex">
						<span className="flex items-center gap-1.5">
							<kbd className="rounded-md border border-border px-1 font-sans">
								↑
							</kbd>
							<kbd className="rounded-md border border-border px-1 font-sans">
								↓
							</kbd>
							{messages.searchHintNavigate}
						</span>
						<span className="flex items-center gap-1.5">
							<kbd className="rounded-md border border-border px-1 font-sans">
								↵
							</kbd>
							{messages.searchHintOpen}
						</span>
						<span className="flex items-center gap-1.5">
							<kbd className="rounded-md border border-border px-1 font-sans">
								Esc
							</kbd>
							{messages.searchHintClose}
						</span>
					</div>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
