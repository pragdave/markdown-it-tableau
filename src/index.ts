import { tableau, generate } from "ts-tableau"
import type { Env, MarkdownIt, RendererRule } from "markdown-it"

const LANGUAGE = "tableau"
const TABLEAU_MD_RE = /<tableau-md>([\s\S]*?)<\/tableau-md>/g

export type MarkdownItTableauOptions = {
  tableau?: typeof tableau
  generate?: typeof generate
}

function unescapeMarkdown(text: string): string {
  return text
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
}

function errorHtml(md: MarkdownIt, message: string): string {
  return `<pre style="border:2px solid #c00;background:#fee;color:#900;padding:0.5rem 0.75rem;white-space:pre-wrap;">${md.utils.escapeHtml(message)}</pre>\n`
}

export default function markdownItTableau(md: MarkdownIt, options: MarkdownItTableauOptions = {}): void {
  const parse = options.tableau ?? tableau
  const render = options.generate ?? generate
  const defaultFence: RendererRule =
    md.renderer.rules.fence ?? ((tokens, idx, opts, _env, self) => self.renderToken(tokens, idx, opts))

  function renderCell(source: string, env?: Env): string {
    return source.includes("\n") ? md.render(source, env) : md.renderInline(source.trim(), env)
  }

  function renderTable(source: string, env?: Env): string {
    const lines = source.replace(/\n$/, "").split("\n")
    const html = render(parse(lines)).join("\n")
    return html.replace(TABLEAU_MD_RE, (_, inner: string) => renderCell(unescapeMarkdown(inner), env)) + "\n"
  }

  md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
    const token = tokens[idx]
    if (token.info.trim().split(/\s+/)[0] !== LANGUAGE) return defaultFence(tokens, idx, opts, env, self)

    try {
      return renderTable(token.content, env)
    } catch (err) {
      const line = token.map ? token.map[0] + 1 : "?"
      return errorHtml(md, `markdown-it-tableau: ${err} (line ${line})`)
    }
  }
}
