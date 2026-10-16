import {
	DesktopIcon,
	type Icon,
	MoonIcon,
	SunIcon,
} from "@phosphor-icons/react";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useLayoutEffect,
	useState,
} from "react";
import { cn } from "../lib/cn.ts";
import { DARK_QUERY } from "../lib/theme-script.ts";
import { useDocs } from "./docs-provider.tsx";

type DocsTheme = "system" | "light" | "dark";

function isDocsTheme(value: unknown): value is DocsTheme {
	return value === "system" || value === "light" || value === "dark";
}

function storedTheme(storageKey: string): DocsTheme {
	try {
		const value = localStorage.getItem(storageKey);
		return isDocsTheme(value) ? value : "system";
	} catch {
		return "system";
	}
}

function storeTheme(storageKey: string, theme: DocsTheme) {
	try {
		localStorage.setItem(storageKey, theme);
	} catch {
		// A private window may refuse storage: the choice then lasts the visit.
	}
}

function applyTheme(theme: DocsTheme) {
	const dark =
		theme === "dark" ||
		(theme === "system" && window.matchMedia(DARK_QUERY).matches);
	document.documentElement.classList.toggle("dark", dark);
}

const ThemeContext = createContext<{
	theme: DocsTheme | undefined;
	setTheme: (theme: DocsTheme) => void;
}>({ theme: undefined, setTheme: () => undefined });

/** Holds the reader's theme while they are in the docs, and hands the page back light when they leave. */
export function DocsThemeProvider({
	storageKey,
	children,
}: {
	/** The localStorage key `themeScript` reads too. */
	storageKey: string;
	children: ReactNode;
}) {
	const [theme, setTheme] = useState<DocsTheme>();

	useLayoutEffect(() => {
		setTheme(storedTheme(storageKey));
		return () => document.documentElement.classList.remove("dark");
	}, [storageKey]);

	useLayoutEffect(() => {
		if (theme) {
			applyTheme(theme);
		}
	}, [theme]);

	useEffect(() => {
		if (theme !== "system") {
			return;
		}
		const query = window.matchMedia(DARK_QUERY);
		function follow() {
			applyTheme("system");
		}
		query.addEventListener("change", follow);
		return () => query.removeEventListener("change", follow);
	}, [theme]);

	function choose(next: DocsTheme) {
		storeTheme(storageKey, next);
		setTheme(next);
	}

	return (
		<ThemeContext.Provider value={{ theme, setTheme: choose }}>
			{children}
		</ThemeContext.Provider>
	);
}

const OPTIONS: ReadonlyArray<{
	value: DocsTheme;
	Icon: Icon;
	label: "themeSystem" | "themeLight" | "themeDark";
}> = [
	{ value: "system", Icon: DesktopIcon, label: "themeSystem" },
	{ value: "light", Icon: SunIcon, label: "themeLight" },
	{ value: "dark", Icon: MoonIcon, label: "themeDark" },
];

export function ThemeSwitcher() {
	const { theme, setTheme } = useContext(ThemeContext);
	const { messages } = useDocs();
	return (
		<div
			role="radiogroup"
			aria-label={messages.themeAria}
			className="inline-flex h-7 items-center gap-0.5 rounded-full border border-border p-0.5"
		>
			{OPTIONS.map(({ value, Icon: OptionIcon, label }) => (
				// biome-ignore lint/a11y/useSemanticElements: three icon buttons read better than radio inputs here.
				<button
					key={value}
					type="button"
					role="radio"
					aria-checked={theme === value}
					aria-label={messages[label]}
					title={messages[label]}
					onClick={() => setTheme(value)}
					className={cn(
						"flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground",
						theme === value && "bg-foreground/10 text-foreground",
					)}
				>
					<OptionIcon className="size-3.5" aria-hidden />
				</button>
			))}
		</div>
	);
}
