import { markdownToHtml } from './markdownToHtml'

/**
 * Converts markdown + LaTeX source to HTML.
 * Uses remark-math + rehype-katex. Headings become inline spans.
 */
export async function latexMarkdownToHtml(source: string): Promise<string> {
  return markdownToHtml(source)
}

/** Heuristic: content looks like LaTeX/markdown (not HTML). */
export function looksLikeLatexOrMarkdown(content: string): boolean {
  const t = content.trim()
  if (!t) return false
  if (t.startsWith('<') && /<\/?(?:p|div|span|h[1-6]|ul|ol|li|blockquote|pre|code)/i.test(t))
    return false
  return true
}
