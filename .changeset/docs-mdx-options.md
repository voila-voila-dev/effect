---
"@voila.dev/docs": minor
---

`docsMdx()` takes options: `remarkPlugins` run after the built-in ones, on a page and on its `?meta`, so a site can publish Markdown it does not own (a README) with its title dropped and its relative links rewritten. A `.md` file compiles through the same pipeline as plain Markdown. Calling `docsMdx()` without options is unchanged.
