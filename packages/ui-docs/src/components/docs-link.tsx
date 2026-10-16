import type { ComponentProps } from "react";

import { useDocs } from "./docs-provider.tsx";

/** A link inside the site goes through the host's router, which keeps the sidebar's scroll position; any other opens a new tab. */
export function DocsLink({
	href,
	...props
}: Omit<ComponentProps<"a">, "href"> & { href: string }) {
	const { Link } = useDocs();
	if (!href.startsWith("/")) {
		const external = /^https?:/u.test(href);
		return (
			<a
				href={href}
				{...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
				{...props}
			/>
		);
	}
	return <Link href={href} {...props} />;
}
