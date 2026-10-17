import { groupTrail, navItemsOf } from "./navigation.ts";
/** A page and each of its sections; `group` is the sidebar group it sits in. */
export function pageSearchEntries(page, group) {
    return [
        {
            kind: "page",
            title: page.title,
            context: group,
            href: page.href,
            keywords: page.description,
            ...(page.tags ? { tags: page.tags } : {}),
        },
        ...page.headings.map((heading) => ({
            kind: "section",
            title: heading.text,
            context: page.title,
            href: `${page.href}#${heading.id}`,
        })),
    ];
}
export function operationSearchEntry(operation) {
    return {
        kind: "operation",
        title: operation.summary,
        context: operation.path,
        href: operation.href,
        keywords: `${operation.tag.name} ${operation.description ?? ""}`,
        method: operation.method,
    };
}
/** What the palette offers before anything is typed: the pages, as the sidebar lists them. */
export function navigationSuggestions(tabs) {
    return tabs.flatMap((tab) => tab.groups.flatMap((group) => navItemsOf(group.items).map((item) => ({
        kind: item.method ? "operation" : "page",
        title: item.title,
        context: groupTrail(tab, group).join(" · "),
        href: item.href,
        ...(item.method ? { method: item.method } : {}),
    }))));
}
