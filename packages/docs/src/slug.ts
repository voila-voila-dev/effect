/** `index` is its folder's page: under `/docs`, `billing/index` is served at `/docs/billing`. */
export function docHref(root: string, slug: string): string {
	const path = slug.replace(/(^|\/)index$/u, "");
	return path === "" ? root : `${root}/${path}`;
}
