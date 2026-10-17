// Plain data, no imports: `vite.config.ts` reads it too, through Node.

export const REPOSITORY = "https://github.com/voila-voila-dev/platform";

/** Where a package's README is served: `packages/http/README.md` is `/packages/http`. */
export const PACKAGES_ROOT = "/packages";

/** The packages ui.voila.dev documents: they get no README page here, and a link to one goes there. */
export const linkedOutPackages: Readonly<Record<string, string>> = {
	ui: "https://ui.voila.dev",
	chart: "https://ui.voila.dev/chart/quick-start",
	motion: "https://ui.voila.dev/motion/quick-start",
};

/** Packages that are not documented at all: configuration the repository shares with itself, and the brand. */
export const undocumentedPackages: ReadonlyArray<string> = [
	"typescript-config",
	"ui-branding",
];
