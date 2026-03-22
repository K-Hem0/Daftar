import { Extension } from '@tiptap/core'
import { InputRule } from '@tiptap/core'

/**
 * Adds input rule for $$...$$ at line start → block math (display mode).
 * Standard LaTeX: $ for inline, $$ for block. The Mathematics extension
 * uses $$$ for block by default; this adds $$ at line start.
 * Replaces the entire paragraph to avoid leaving empty paragraphs (literal blank lines).
 */
export const BlockMathInputRule = Extension.create({
  name: 'blockMathInput',

  addInputRules() {
    return [
      new InputRule({
        find: /^\$\$([^$]+)\$\$$/,
        handler: ({ state, range, match, chain }) => {
          const latex = (match[1] ?? '').trim()
          if (!latex) return null
          const $from = state.doc.resolve(range.from)
          const from = $from.before()
          const to = $from.after()
          chain()
            .deleteRange({ from, to })
            .insertContentAt(from, { type: 'blockMath', attrs: { latex } })
            .run()
        },
      }),
    ]
  },
})
