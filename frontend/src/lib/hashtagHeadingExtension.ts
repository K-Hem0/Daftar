import { Extension } from '@tiptap/core'
import { InputRule } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

const HASHTAG_AT_START = /^(#{1,3})\s*(.*)$/

/**
 * Notion-style inline headings from hashtags:
 * - Type # , ## , or ### + space at line start → text gets inline heading mark
 * - Type # text and press Enter → same, stays in paragraph flow
 */
export const HashtagHeadingExtension = Extension.create({
  name: 'hashtagHeading',

  addInputRules() {
    return [
      new InputRule({
        // Require at least one non-space char after # + space so user can type "# " first
        find: /^(#{1,3})\s+(\S.*)$/,
        handler: ({ range, match, chain }) => {
          const level = Math.min((match[1] ?? '#').length, 3) as 1 | 2 | 3
          const raw = match[2] ?? ''
          const text = raw.replace(/^\s+/, '').replace(/\s+$/, '')
          if (!text) return null
          chain()
            .deleteRange(range)
            .insertContent({
              type: 'text',
              text,
              marks: [{ type: 'inlineHeading', attrs: { level } }],
            })
            .focus()
            .run()
        },
      }),
    ]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state } = this.editor
        const { $from } = state.selection
        const parent = $from.parent

        if (parent.type.name !== 'paragraph') return false
        if (this.editor.isActive('codeBlock')) return false

        const text = parent.textContent
        const match = text.match(HASHTAG_AT_START)

        if (match) {
          const level = Math.min(match[1].length, 3) as 1 | 2 | 3
          const rest = (match[2] ?? '').trim()
          const from = $from.before()
          const to = $from.after()
          const { schema } = state

          const mark = schema.marks.inlineHeading?.create({ level })
          if (!mark) return false

          const headingPara = schema.nodes.paragraph.create(
            null,
            schema.text(rest, [mark])
          )
          const blockIndex = $from.index(1)
          const hasBlockAfter = blockIndex + 1 < state.doc.childCount
          const nodes = hasBlockAfter
            ? [headingPara]
            : [headingPara, schema.nodes.paragraph.create()]

          const tr = state.tr.replaceWith(from, to, nodes)

          const targetPos = from + headingPara.nodeSize
          const resolved = tr.doc.resolve(targetPos)
          tr.setSelection(TextSelection.near(resolved))
          this.editor.view.dispatch(tr)

          return true
        }

        const mark = state.schema.marks.inlineHeading
        if (!mark) return false
        const from = $from.start()
        const to = $from.end()
        const hasHeadingMark = state.doc.rangeHasMark(from, to, mark)
        if (!hasHeadingMark) return false
        const atEnd = $from.pos === $from.end()
        if (!atEnd) return false

        const schema = state.schema
        const newPara = schema.nodes.paragraph.create()
        const tr = state.tr.insert($from.after(), newPara)
        tr.setSelection(TextSelection.near(tr.doc.resolve($from.after() + 1)))
        this.editor.view.dispatch(tr)
        return true
      },
    }
  },
})
