# @voila.dev/docs

## 0.2.0

### Minor Changes

- e1909d3: `docsMdx()` takes options: `remarkPlugins` run after the built-in ones, on a page and on its `?meta`, so a site can publish Markdown it does not own (a README) with its title dropped and its relative links rewritten. A `.md` file compiles through the same pipeline as plain Markdown. Calling `docsMdx()` without options is unchanged.

## 0.1.0

### Minor Changes

- cd13934: First release: `@voila.dev/docs` holds the framework-free half of a documentation site (navigation registry, reader contexts, typo-tolerant search, a link graph check, an OpenAPI reference model and the MDX pipeline for Vite), and `@voila.dev/ui-docs` its React layer (frame, sidebar, outline, search palette, guide chrome, MDX components and API reference pages) on Tailwind CSS 4 and Base UI.
