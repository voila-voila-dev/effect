import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { SearchEntry, SynonymGroups } from "@voila.dev/docs/search";
import {
	createContext,
	lazy,
	type ReactNode,
	Suspense,
	useContext,
	useEffect,
	useState,
} from "react";
import { useDocs } from "../docs-provider.tsx";

export interface DocsSearchIndex {
	entries: ReadonlyArray<SearchEntry>;
	/** What the palette lists before anything is typed. */
	suggestions: ReadonlyArray<SearchEntry>;
	/** The site's words for the same thing: a query with one finds the pages using another. */
	synonyms?: SynonymGroups;
}

export type LoadSearchIndex = () => Promise<DocsSearchIndex>;

function loadSearchDialog() {
	return import("./search-dialog.tsx");
}

interface SearchTriggers {
	show: () => void;
	preload: () => void;
}

const SearchContext = createContext<SearchTriggers>({
	show: () => undefined,
	preload: () => undefined,
});

/** Owns the palette: Cmd/Ctrl+K anywhere in the docs, and the triggers below. The palette and its index load on first use. */
export function DocsSearchProvider({
	loadIndex,
	children,
}: {
	loadIndex: LoadSearchIndex;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const [requested, setRequested] = useState(false);
	const [SearchDialog] = useState(() =>
		lazy(() => {
			const loading = loadIndex();
			return import("./search-dialog.tsx").then(
				async ({ SearchDialog: LoadedDialog }) => {
					const index = await loading;
					return {
						default(props: {
							open: boolean;
							onOpenChange: (open: boolean) => void;
						}) {
							return <LoadedDialog {...props} {...index} />;
						},
					};
				},
			);
		}),
	);

	function preload() {
		void loadSearchDialog();
		loadIndex();
	}

	function show() {
		setRequested(true);
		setOpen(true);
	}

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setRequested(true);
				setOpen((current) => !current);
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<SearchContext.Provider value={{ show, preload }}>
			{children}
			{requested ? (
				<Suspense fallback={null}>
					<SearchDialog open={open} onOpenChange={setOpen} />
				</Suspense>
			) : null}
		</SearchContext.Provider>
	);
}

function usePlatformShortcut(): string {
	const [shortcut, setShortcut] = useState("Ctrl K");
	useEffect(() => {
		if (/Mac|iPhone|iPad/u.test(navigator.platform)) {
			setShortcut("⌘K");
		}
	}, []);
	return shortcut;
}

export function SearchButton() {
	const { show, preload } = useContext(SearchContext);
	const { messages } = useDocs();
	const shortcut = usePlatformShortcut();
	return (
		<button
			type="button"
			onClick={show}
			onPointerEnter={preload}
			onFocus={preload}
			aria-haspopup="dialog"
			className="flex h-[2.375rem] w-full items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 text-docs-sm text-muted-foreground transition-colors hover:border-foreground/20"
		>
			<MagnifyingGlassIcon className="size-4" aria-hidden />
			<span className="flex-1 text-left">{messages.searchButton}</span>
			<kbd className="font-sans text-muted-foreground text-xs">{shortcut}</kbd>
		</button>
	);
}

export function SearchIconButton() {
	const { show } = useContext(SearchContext);
	const { messages } = useDocs();
	return (
		<button
			type="button"
			onClick={show}
			aria-haspopup="dialog"
			aria-label={messages.searchTitle}
			className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
		>
			<MagnifyingGlassIcon className="size-5" aria-hidden />
		</button>
	);
}
