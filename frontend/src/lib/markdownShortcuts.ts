/**
 * Markdown keyboard shortcuts for the CodeMirror/LaTeX editor.
 * Matches the shortcuts advertised in shortcutDefinitions (Bold, Italic, etc.)
 * by inserting markdown syntax.
 */
import { keymap } from '@codemirror/view'
import type { KeyBinding } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'
import type { EditorState } from '@codemirror/state'

function getLineStart(state: EditorState, pos: number): number {
  const line = state.doc.lineAt(pos)
  return line.from
}

function getLineEnd(state: EditorState, pos: number): number {
  const line = state.doc.lineAt(pos)
  return line.to
}

function insertHeading(level: 1 | 2 | 3) {
  return (view: import('@codemirror/view').EditorView) => {
    const { state } = view
    const pos = state.selection.main.head
    const lineStart = getLineStart(state, pos)
    const lineEnd = getLineEnd(state, pos)
    const line = state.sliceDoc(lineStart, lineEnd)
    const prefix = '#'.repeat(level) + ' '
    const isAlready = line.match(new RegExp(`^#{1,6}\\s`))
    let replacement: string
    let newSelection: { from: number; to: number }
    if (isAlready) {
      replacement = line.replace(/^#{1,6}\s*/, prefix)
    } else {
      replacement = prefix + line
    }
    view.dispatch({
      changes: { from: lineStart, to: lineEnd, insert: replacement },
      selection: EditorSelection.cursor(lineStart + replacement.length),
    })
    return true
  }
}

function wrapSelection(open: string, close: string) {
  return (view: import('@codemirror/view').EditorView) => {
    const { state } = view
    const { from, to } = state.selection.main
    const selected = state.sliceDoc(from, to)
    if (selected) {
      view.dispatch({
        changes: [
          { from, to, insert: open + selected + close },
        ],
        selection: EditorSelection.range(from + open.length, to + open.length),
      })
    } else {
      const insert = open + close
      view.dispatch({
        changes: { from, insert },
        selection: EditorSelection.cursor(from + open.length),
      })
    }
    return true
  }
}

function insertLink(view: import('@codemirror/view').EditorView) {
  const { state } = view
  const { from, to } = state.selection.main
  const selected = state.sliceDoc(from, to)
  const text = selected || 'link text'
  const url = window.prompt('Link URL', 'https://')
  if (url === null) return false
  const trimmed = url.trim()
  const insert = trimmed
    ? `[${text}](${trimmed})`
    : `[${text}]()`
  view.dispatch({
    changes: { from, to, insert },
    selection: EditorSelection.range(
      from + 1,
      from + 1 + text.length
    ),
  })
  return true
}

const markdownKeymap: KeyBinding[] = [
  { key: 'Mod-1', run: insertHeading(1), preventDefault: true },
  { key: 'Mod-2', run: insertHeading(2), preventDefault: true },
  { key: 'Mod-3', run: insertHeading(3), preventDefault: true },
  { key: 'Mod-b', run: wrapSelection('**', '**'), preventDefault: true },
  { key: 'Mod-i', run: wrapSelection('*', '*'), preventDefault: true },
  { key: 'Mod-u', run: wrapSelection('<u>', '</u>'), preventDefault: true },
  { key: 'Mod-k', run: insertLink, preventDefault: true },
]

export function markdownShortcutsKeymap() {
  return keymap.of(markdownKeymap)
}
