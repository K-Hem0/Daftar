import { useEffect, useRef, useState } from 'react'
import { markdownToHtml } from '../../lib/markdownToHtml'
import { cn } from '../../lib/cn'

type LatexMathPreviewProps = {
  source: string
  className?: string
}

/**
 * Renders markdown + LaTeX via remark-math + rehype-katex.
 * Headings become inline spans; math rendered with KaTeX.
 */
export function LatexMathPreview({ source, className }: LatexMathPreviewProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [html, setHtml] = useState<string>('')
  const [err, setErr] = useState(false)

  useEffect(() => {
    let cancelled = false
    setErr(false)
    markdownToHtml(source)
      .then((h) => {
        if (!cancelled) setHtml(h)
      })
      .catch(() => {
        if (!cancelled) {
          setErr(true)
          setHtml('')
        }
      })
    return () => {
      cancelled = true
    }
  }, [source])

  useEffect(() => {
    const el = ref.current
    if (!el || err) return
    el.innerHTML = html
  }, [html, err])

  if (err) {
    return (
      <div className={cn('text-sm text-red-500', className)}>
        Failed to render preview
      </div>
    )
  }

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
