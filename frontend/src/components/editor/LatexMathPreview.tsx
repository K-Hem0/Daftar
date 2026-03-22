import { useEffect, useRef } from 'react'
import MarkdownIt from 'markdown-it'
import { cn } from '../../lib/cn'
import renderMathInElement from 'katex/contrib/auto-render'

const md = new MarkdownIt({ html: true }) // allows <u> for underline

type LatexMathPreviewProps = {
  source: string
  className?: string
}

/**
 * Renders markdown + LaTeX. Converts markdown to HTML, then KaTeX renders math in $…$, $$…$$, etc.
 */
export function LatexMathPreview({ source, className }: LatexMathPreviewProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    try {
      el.innerHTML = md.render(source)
      renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
        strict: 'ignore',
      })
    } catch {
      el.textContent = source
    }
  }, [source])

  return (
    <div
      ref={ref}
      className={cn(
        'latex-math-preview',
        '[&_code]:rounded [&_code]:bg-slate-200/60 [&_code]:px-1 [&_code]:text-[0.9em] dark:[&_code]:bg-white/10',
        'text-[14px] leading-relaxed text-slate-800 dark:text-slate-300',
        className
      )}
    />
  )
}
