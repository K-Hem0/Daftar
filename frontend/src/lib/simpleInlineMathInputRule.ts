import { Extension } from '@tiptap/core'
import { InputRule } from '@tiptap/core'

/**
 * Adds input rule for single $...$ inline math (common LaTeX convention).
 * The Mathematics extension uses $$ for inline; this adds $ for familiarity.
 * Excludes $digits$ to avoid matching currency like $100$.
 */
export const SimpleInlineMathInputRule = Extension.create({
  name: 'simpleInlineMathInput',

  addInputRules() {
    return [
      new InputRule({
        find: /(^|[^$])\$([^$\d][^$]*?)\$(?!\d)/,
        handler: ({ range, match, chain }) => {
          const latex = (match[2] ?? '').trim()
          if (!latex) return null
          const prefixLen = (match[1] ?? '').length
          const from = range.from + prefixLen
          const to = range.to
          chain()
            .deleteRange({ from, to })
            .insertContentAt(from, {
              type: 'inlineMath',
              attrs: { latex },
            })
            .run()
        },
      }),
    ]
  },
})
