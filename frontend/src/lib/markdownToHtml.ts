/**
 * Markdown + LaTeX to HTML using remark/rehype pipeline.
 * - Headings (#, ##, ###) → inline <span class="heading heading-N"> (no block, no spacing)
 * - Math: $...$ inline, $$...$$ block via remark-math + rehype-katex
 */
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'
import type { Element, Root } from 'hast'
import { visit } from 'unist-util-visit'

/** Rehype plugin: convert h1–h6 to inline span.heading (no block, no spacing) */
function rehypeHeadingsToInlineSpan() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      const match = node.tagName?.match(/^h([1-6])$/)
      if (!match) return
      const level = Math.min(parseInt(match[1], 10), 3) as 1 | 2 | 3
      node.tagName = 'span'
      node.properties = node.properties ?? {}
      node.properties.className = ['heading', `heading-${level}`]
      node.properties['data-inline-heading'] = String(level)
    })
  }
}

/** Rehype plugin: strip margin from .katex-display (runs after rehype-katex) */
function rehypeKatexNoMargin() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      const classes = node.properties?.className
      const classList = Array.isArray(classes)
        ? classes
        : typeof classes === 'string'
          ? classes.split(/\s+/)
          : []
      const hasMathDisplay =
        classList.includes('katex-display') ||
        classList.includes('math-display')
      if (hasMathDisplay) {
        node.properties = node.properties ?? {}
        const prev = (node.properties.style as string) ?? ''
        node.properties.style = prev
          ? `${prev};margin:0!important`
          : 'margin:0!important'
      }
    })
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeHeadingsToInlineSpan)
  .use(rehypeKatex, { throwOnError: false, strict: false })
  .use(rehypeKatexNoMargin)
  .use(rehypeStringify)

/**
 * Converts markdown + LaTeX source to HTML.
 * Headings become inline spans; math is rendered via KaTeX.
 */
export async function markdownToHtml(source: string): Promise<string> {
  if (typeof source !== 'string' || source.trim() === '') return '<p></p>'
  try {
    const result = await processor.process(source)
    return String(result)
  } catch {
    return `<p>${escapeHtml(source.slice(0, 500))}</p>`
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
