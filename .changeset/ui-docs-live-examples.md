---
"@voila.dev/ui-docs": minor
---

What a component library's docs need from the frame:

- `Preview` in `mdxComponents`: a live example on a faint grid, with a `label`, a `layout` (`row`, `stack`, `center`) and `scroll` for a wide one. Its styles are in `docs.css` (`docs-preview*`).
- `docs-prose` stays out of any `not-prose` element, so the components a page shows look as they do in an app.
- `DocsFrame` takes `themeScope="site"` (and `DocsThemeProvider` `scope="site"`) for a host whose other pages follow the reader's theme: leaving the docs no longer hands the page back light.
- The header's tabs scroll sideways when there are more than fit, and wrap in the phone drawer.
