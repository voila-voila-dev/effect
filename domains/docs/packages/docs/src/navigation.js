export function isNavFolder(entry) {
    return "items" in entry;
}
/** The pages of a list of entries, folders opened, in sidebar order. */
export function navItemsOf(entries) {
    return entries.flatMap((entry) => isNavFolder(entry) ? navItemsOf(entry.items) : [entry]);
}
/** The slugs a list of registry entries names, folders opened, in sidebar order. */
export function slugsOf(entries) {
    return entries.flatMap((entry) => typeof entry === "string" ? [entry] : slugsOf(entry.pages));
}
function resolveEntry(entry, pages) {
    if (typeof entry !== "string") {
        return {
            label: entry.label,
            items: entry.pages.map((child) => resolveEntry(child, pages)),
        };
    }
    return pageEntry(entry, pages);
}
function pageEntry(slug, pages) {
    const page = pages.get(slug);
    if (!page) {
        throw new Error(`docs navigation lists "${slug}", but its MDX file does not exist`);
    }
    return {
        title: page.title,
        ...(page.sidebarTitle ? { sidebarTitle: page.sidebarTitle } : {}),
        href: page.href,
        ...(page.icon ? { icon: page.icon } : {}),
    };
}
function groupsOf(tab, pages, apiGroups) {
    if ("apiReference" in tab) {
        return apiGroups;
    }
    return tab.groups.map((group) => ({
        label: group.label,
        ...(group.audience ? { audience: group.audience } : {}),
        items: group.pages.map((entry) => resolveEntry(entry, pages)),
    }));
}
function audiencesOf(tab, groups) {
    const declared = "audiences" in tab ? (tab.audiences ?? []) : [];
    const undeclared = groups.filter((group) => group.audience !== undefined &&
        !declared.some((audience) => audience.id === group.audience));
    if (undeclared[0]) {
        throw new Error(`docs navigation: the group "${undeclared[0].label}" names the audience "${undeclared[0].audience}", which its tab's audiences do not declare`);
    }
    return declared.map((audience) => {
        const landing = navItemsOf(groups
            .filter((group) => group.audience === audience.id)
            .flatMap((group) => group.items))[0];
        if (!landing) {
            throw new Error(`docs navigation: the audience "${audience.id}" has no group with a page`);
        }
        return { id: audience.id, label: audience.label, href: landing.href };
    });
}
/** The registry with each slug replaced by its page; a tab with nothing to show is dropped. */
export function resolveNavigation(navigation, pages, apiGroups) {
    return navigation.flatMap((tab) => {
        const groups = groupsOf(tab, pages, apiGroups);
        const first = navItemsOf(groups.flatMap((group) => group.items))[0];
        return first
            ? [
                {
                    label: tab.label,
                    ...(tab.icon ? { icon: tab.icon } : {}),
                    href: first.href,
                    audiences: audiencesOf(tab, groups),
                    groups,
                },
            ]
            : [];
    });
}
/** The audience a group belongs to, as its tab declares it. */
export function audienceOfGroup(tab, group) {
    return tab.audiences.find((audience) => audience.id === group.audience);
}
/** A group's place for a reader: its audience's name before it, since two audiences share topic names. */
export function groupTrail(tab, group) {
    const audience = audienceOfGroup(tab, group);
    return audience ? [audience.label, group.label] : [group.label];
}
/** The folders leading to the page at `href`, or undefined when the entries do not hold it. */
function foldersTo(entries, href) {
    for (const entry of entries) {
        if (!isNavFolder(entry)) {
            if (entry.href === href) {
                return [];
            }
            continue;
        }
        const inner = foldersTo(entry.items, href);
        if (inner) {
            return [entry, ...inner];
        }
    }
    return undefined;
}
function locationIn(tab, path) {
    const items = navItemsOf(tab.groups.flatMap((group) => group.items));
    const index = items.findIndex((candidate) => candidate.href === path);
    const item = items[index];
    const holder = tab.groups.flatMap((group) => {
        const folders = foldersTo(group.items, path);
        return folders ? [{ group, folders }] : [];
    })[0];
    if (!(item && holder)) {
        return undefined;
    }
    const audience = audienceOfGroup(tab, holder.group);
    return {
        tab,
        ...(audience ? { audience } : {}),
        ...holder,
        item,
        ...(items[index - 1] ? { previous: items[index - 1] } : {}),
        ...(items[index + 1] ? { next: items[index + 1] } : {}),
    };
}
export function locate(tabs, pathname) {
    const path = pathname.replace(/(.)\/+$/u, "$1");
    for (const tab of tabs) {
        const location = locationIn(tab, path);
        if (location) {
            return location;
        }
    }
    return undefined;
}
/** Every guides group of a registry as a landing topic, in sidebar order. */
export function navigationTopics(navigation) {
    return navigation.flatMap((tab) => "groups" in tab
        ? tab.groups.map((group) => ({
            label: group.label,
            slugs: group.pages.filter((entry) => typeof entry === "string"),
        }))
        : []);
}
/** How a registry covers the page files it orders: a sound one lists every page exactly once and nothing else. */
export function navigationCoverage(navigation, filed) {
    const listed = navigation.flatMap((tab) => "groups" in tab ? tab.groups.flatMap((group) => slugsOf(group.pages)) : []);
    return {
        unlisted: filed.filter((slug) => !listed.includes(slug)),
        repeated: listed.filter((slug, index) => listed.indexOf(slug) !== index),
        missing: listed.filter((slug) => !filed.includes(slug)),
    };
}
