/*
 * Rewrites the manifests of the UI packages for publishing, right before
 * scripts/publish.ts packs them (`bun run release`).
 *
 * In the repo, the UI packages' exports target src/ so the apps, Storybook and
 * tests consume source through the workspace symlinks with zero build step.
 * The tarball is the one place they flip to dist/: this points exports at
 * dist/, drops devDependencies (consumers never install them) and the build
 * script (it references ../../scripts, which never ships), and pins the
 * `workspace:` references to the siblings' versions. `imports` stays on
 * ./src/*: dist uses relative specifiers, but the shipped sources still say
 * `#/...` — go-to-definition lands there and the consumer's TS server resolves
 * those through this field.
 *
 * Only the packages listed in UI_PACKAGES are touched: the other platform
 * packages already export dist/ through conditions.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const UI_PACKAGES = ["chart", "motion", "ui"];

const toDist = (value) =>
	value.replace(/^\.\/src\//, "./dist/").replace(/\.tsx?$/, ".js");

const manifests = fs
	.readdirSync(path.join(root, "packages"))
	.map((dir) => path.join(root, "packages", dir, "package.json"))
	.filter((file) => fs.existsSync(file))
	.map((file) => ({ file, pkg: JSON.parse(fs.readFileSync(file, "utf8")) }));

/** The version each sibling ships at: what a `workspace:` reference to it means once published. */
const siblings = new Map(
	manifests.map(({ pkg }) => [pkg.name, pkg.private ? null : pkg.version]),
);

/*
 * bun pm pack resolves `workspace:*` from the versions bun.lock recorded,
 * not from the manifests: it packed @voila.dev/ui 5.0.114 without its
 * @voila.dev/motion dependency at all. Writing the sibling's version in
 * ourselves leaves bun nothing to resolve.
 */
function pinWorkspaceRefs(pkg) {
	for (const field of [
		"dependencies",
		"peerDependencies",
		"optionalDependencies",
	]) {
		for (const [name, range] of Object.entries(pkg[field] ?? {})) {
			if (!String(range).startsWith("workspace:")) continue;
			const pinned = siblings.get(name);
			if (!pinned) {
				throw new Error(
					`${pkg.name} ships a ${field} on ${name}, which is not published`,
				);
			}
			pkg[field][name] = pinned;
		}
	}
}

for (const { file, pkg } of manifests) {
	if (pkg.private) continue;
	if (!UI_PACKAGES.includes(path.basename(path.dirname(file)))) continue;

	if (pkg.scripts?.build) {
		for (const [key, value] of Object.entries(pkg.exports ?? {})) {
			pkg.exports[key] = toDist(value);
		}
		delete pkg.scripts.build;
	}
	delete pkg.devDependencies;
	pinWorkspaceRefs(pkg);
	console.log(`${pkg.name}: manifest ready to publish`);

	fs.writeFileSync(file, `${JSON.stringify(pkg, null, "\t")}\n`);
}
