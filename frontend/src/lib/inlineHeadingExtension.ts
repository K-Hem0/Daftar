import { Mark } from '@tiptap/core'

export type InlineHeadingLevel = 1 | 2 | 3

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineHeading: {
      setInlineHeading: (level: InlineHeadingLevel) => ReturnType
      toggleInlineHeading: (level: InlineHeadingLevel) => ReturnType
      unsetInlineHeading: () => ReturnType
    }
  }
}

/**
 * Inline heading mark — Notion-style headings as spans in the text flow.
 * No line breaks; styled for emphasis (font-size, weight).
 */
export const InlineHeadingExtension = Mark.create({
  name: 'inlineHeading',

  addAttributes() {
    return {
      level: {
        default: 1,
        parseHTML: (el) => {
          const node = el as HTMLElement
          const m = node.className?.match(/heading-([123])/)
          return m ? parseInt(m[1], 10) as InlineHeadingLevel : 1
        },
        renderHTML: (attrs) => ({ level: attrs.level }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span.heading',
        getAttrs: (node) => {
          const el = node as HTMLElement
          const m = el.className?.match(/heading-([123])/)
          return { level: m ? parseInt(m[1], 10) : 1 }
        },
      },
      {
        tag: 'span[data-inline-heading]',
        getAttrs: (node) => {
          const el = node as HTMLElement
          const level = parseInt(el.getAttribute('data-inline-heading') ?? '1', 10)
          return { level: Math.min(Math.max(level, 1), 3) as InlineHeadingLevel }
        },
      },
    ]
  },

  renderHTML({ mark }) {
    const level = (mark.attrs?.level ?? 1) as InlineHeadingLevel
    return [
      'span',
      {
        class: `heading heading-${level}`,
        'data-inline-heading': String(level),
      },
      0,
    ]
  },

  addCommands() {
    return {
      setInlineHeading:
        (level) =>
        ({ commands, state }) => {
          const { from, to } = state.selection
          const text = state.doc.textBetween(from, to)
          if (!text.trim()) {
            return commands.insertContent(
              state.schema.text('', [this.type.create({ level })])
            )
          }
          return commands.setMark(this.name, { level })
        },
      toggleInlineHeading:
        (level) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, { level })
        },
      unsetInlineHeading:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
    }
  },
})
