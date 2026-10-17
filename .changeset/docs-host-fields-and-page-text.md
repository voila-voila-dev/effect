---
"@voila.dev/docs": minor
---

What a site with hundreds of component pages needs from the docs pipeline:

- `docFrontmatter(vocabulary, { extend })` validates a site's own frontmatter fields (`category`, `sidebar.order`…) beside the shared ones; the schema stays strict, so an undeclared key is still refused.
- `page.mdx?text` compiles a page down to `text`, its prose without code listings (8,000 characters at most), and `pageSearchEntries` matches a page on it when the page passes its `text`. A site globs `?text` from its lazily loaded search index, so the prose never reaches the first chunk.
- `page.mdx?meta` no longer keeps a page's imports: listing every page's frontmatter and headings no longer loads the examples a page imports.
- `searchDocs` folds each entry once instead of on every query.
