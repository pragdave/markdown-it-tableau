# markdown-it-tableau

A [markdown-it](https://github.com/markdown-it/markdown-it) plugin that renders ` ```tableau ` fenced code blocks (using the [`ts-tableau`](https://github.com/pragdave/ts-tableau) library) as HTML tables. That covers VitePress, Eleventy, Marp, and anything else built on markdown-it.

## Install

```sh
npm install markdown-it-tableau
```

## Usage

```js
import MarkdownIt from "markdown-it"
import markdownItTableau from "markdown-it-tableau"

const md = new MarkdownIt().use(markdownItTableau)

console.log(md.render(markdown))
```

Load `ts-tableau/tableau.css` on the page for the tables' default styling.

The table markup inside the fence (data, then an optional `===` and a layout section) is documented in the [Tableau guide](https://pragdave.github.io/ts-tableau/). Anything after `tableau` on the info line is ignored.

Cell contents are rendered as Markdown by the same markdown-it instance as the rest of the document, so every plugin you've registered, and options such as `html`, apply inside cells too. Single-line cells are rendered inline. Multi-line cells, written with `col N {{ ... }}` blocks, are rendered as block Markdown (paragraphs, lists).

A table that fails to parse doesn't break the document: its fence is replaced with a red error box that gives the message and the fence's line number.

### VitePress

```js
// .vitepress/config.js
import markdownItTableau from "markdown-it-tableau"

export default {
  markdown: {
    config: (md) => md.use(markdownItTableau),
  },
}
```

```js
// .vitepress/theme/index.js
import DefaultTheme from "vitepress/theme"
import "ts-tableau/tableau.css"

export default DefaultTheme
```

## Choosing the ts-tableau engine

By default the plugin renders with the `ts-tableau` package it depends on. To render with a different or local build of `ts-tableau` instead, pass its `tableau` and `generate` functions (either one alone is fine; the other falls back to the default):

```js
import { tableau, generate } from "../ts-tableau/dist/index.js"

md.use(markdownItTableau, { tableau, generate })
```

## Security

Raw HTML written inside a cell follows your markdown-it `html` option: escaped by default, passed through with `html: true`. The table markup that Tableau itself generates is always emitted. If you render untrusted Markdown with `html: true`, sanitize the output, the same as you would for the rest of the document.

## Related projects

- [ts-tableau](https://github.com/pragdave/ts-tableau): the library that does the parsing and rendering.
- [remark-tableau](https://github.com/pragdave/remark-tableau): the same job for unified/remark pipelines.
- [slidev-addon-tableau](https://github.com/pragdave/slidev-addon-tableau): Tableau tables in Slidev decks.

## License

ISC
