import { describe, expect, it, vi } from "vitest"
import MarkdownIt from "markdown-it"
import type { MarkdownItOptions, MarkdownIt as MarkdownItInstance } from "markdown-it"
import { tableau, generate } from "ts-tableau"
import markdownItTableau from "../src/index.js"
import type { MarkdownItTableauOptions } from "../src/index.js"

function render(markdown: string, options?: MarkdownItTableauOptions, mdOptions: MarkdownItOptions = {}) {
  return new MarkdownIt(mdOptions).use(markdownItTableau, options).render(markdown)
}

describe("markdown-it-tableau", () => {
  it("renders a tableau fence as a table", () => {
    const html = render("```tableau\na|b\nc|d\n```\n")
    expect(html).toMatch(/^<table class="tableau/)
    expect(html).toContain("<td>a</td>")
    expect(html).toContain("<td>d</td>")
    expect(html).not.toContain("<pre")
  })

  it("renders single-line cells as inline markdown", () => {
    const html = render("```tableau\n_a_|**b**\nc|`d`\n```\n")
    expect(html).toContain("<td><em>a</em></td>")
    expect(html).toContain("<td><strong>b</strong></td>")
    expect(html).toContain("<td><code>d</code></td>")
  })

  it("renders multi-line cells as block markdown", () => {
    const html = render("```tableau\na|b\ncol2 {{\n  para one\n\n  - item\n}}\n```\n")
    expect(html).toContain("<p>para one</p>")
    expect(html).toContain("<li>item</li>")
  })

  it("renders the caption as markdown", () => {
    const html = render("```tableau\na|b\n===\n# A *big* table\n```\n")
    expect(html).toContain("<em>big</em>")
    expect(html).not.toContain("<tableau-md>")
  })

  it("round-trips characters that ts-tableau escapes", () => {
    const html = render("```tableau\n`a < b && c > d`|x\n```\n")
    expect(html).toContain("<code>a &lt; b &amp;&amp; c &gt; d</code>")
  })

  it("leaves no tableau-md markers behind", () => {
    expect(render("```tableau\na||\n|b|\n```\n")).not.toContain("tableau-md")
  })

  it("leaves other fences to the existing fence rule", () => {
    const html = render("```js\nconst x = 1\n```\n")
    expect(html).toBe('<pre><code class="language-js">const x = 1\n</code></pre>\n')
  })

  it("delegates other fences to a fence rule installed by an earlier plugin", () => {
    const md = new MarkdownIt()
    md.renderer.rules.fence = () => "<custom/>"
    md.use(markdownItTableau)
    expect(md.render("```js\nx\n```\n")).toBe("<custom/>")
    expect(md.render("```tableau\na|b\n```\n")).toContain("<table")
  })

  it("accepts extra words after the language on the info line", () => {
    expect(render("```tableau {.wide}\na|b\n```\n")).toContain("<table")
  })

  it("does not treat a language that merely starts with tableau as a table", () => {
    expect(render("```tableaux\na|b\n```\n")).toContain('<code class="language-tableaux">')
  })

  it("renders cells with the host's own plugins", () => {
    const md = new MarkdownIt()
      .use((m: MarkdownItInstance) => {
        m.core.ruler.push("shout", (state) => {
          for (const token of state.tokens) {
            for (const child of token.children ?? []) {
              if (child.type === "text") child.content = child.content.toUpperCase()
            }
          }
        })
      })
      .use(markdownItTableau)
    expect(md.render("```tableau\nquiet|b\n```\n")).toContain("<td>QUIET</td>")
  })

  it("follows the host's html option for raw HTML inside cells", () => {
    const source = "```tableau\n<b>x</b>|y\n```\n"
    expect(render(source)).toContain("&lt;b&gt;x&lt;/b&gt;")
    expect(render(source, undefined, { html: true })).toContain("<td><b>x</b></td>")
  })

  it("passes env through to cell rendering", () => {
    const md = new MarkdownIt().use(markdownItTableau)
    md.core.ruler.push("see-env", (state) => {
      ;(state.env as { seen?: number }).seen = ((state.env as { seen?: number }).seen ?? 0) + 1
    })
    const env: { seen?: number } = {}
    md.render("```tableau\na|b\n```\n", env)
    expect(env.seen).toBe(3)
  })

  it("renders an inline error for a malformed table without failing the document", () => {
    const html = render("text\n\n```tableau\na|b\n===\n===\n```\n\n```tableau\nc|d\n```\n")
    expect(html).toContain("<p>text</p>")
    expect(html).toContain("markdown-it-tableau:")
    expect(html).toContain("(line 3)")
    expect(html).toContain("<td>c</td>")
  })

  it("uses the tableau and generate functions passed in", () => {
    const parse = vi.fn(tableau)
    const gen = vi.fn(generate)
    render("```tableau\na|b\n```\n", { tableau: parse, generate: gen })
    expect(parse).toHaveBeenCalledWith(["a|b"])
    expect(gen).toHaveBeenCalledOnce()
  })
})
