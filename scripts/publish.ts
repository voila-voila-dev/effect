/*
 * Publishes every public workspace package whose version is not on npm yet.
 *
 * bun packs and npm publishes, because each does half the job: `bun pm pack`
 * resolves the `catalog:` and `workspace:` ranges into concrete versions, and
 * npm is what speaks trusted publishing (OIDC). The "New tag:" lines are what
 * changesets/action reads to create the GitHub releases.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const root = join(import.meta.dirname, "..");
const out = join(root, "node_modules", ".packed");

for (const directory of readdirSync(join(root, "packages"))) {
	const packageDirectory = join(root, "packages", directory);
	const manifest = JSON.parse(
		readFileSync(join(packageDirectory, "package.json"), "utf8"),
	) as { name: string; version: string; private?: boolean };
	if (manifest.private) continue;

	const id = `${manifest.name}@${manifest.version}`;
	const published = await $`npm view ${id} version`.quiet().nothrow();
	if (
		published.exitCode === 0 &&
		published.text().trim() === manifest.version
	) {
		console.log(`${id} is already on npm`);
		continue;
	}

	await $`rm -rf ${out} && mkdir -p ${out}`;
	await $`bun pm pack --destination ${out}`.cwd(packageDirectory).quiet();
	const [tarball] = readdirSync(out);
	await $`npm publish ${join(out, tarball ?? "")} --access public ${process.argv.slice(2)}`;
	await $`git tag ${id}`.nothrow();
	console.log(`New tag: ${id}`);
}
