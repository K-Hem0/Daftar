import type { EditorMode, Note } from '../types'

const RICH_EMPTY = '<p></p>'

function normalizeEditorMode(v: unknown): EditorMode {
  return v === 'latex' ? 'latex' : 'rich'
}

function normalizeRichHtml(raw: unknown): string {
  if (typeof raw !== 'string') return RICH_EMPTY
  return raw.trim() === '' ? RICH_EMPTY : raw
}

function normalizeLatexSource(raw: unknown): string {
  return typeof raw === 'string' ? raw : ''
}

/**
 * Coerce partial or legacy in-memory notes into a safe `Note` for the UI and TipTap.
 * Used when creating notes and when hydrating from disk/import.
 */
export function normalizeNoteForApp(note: Partial<Note> & { id?: string }): Note {
  const now = new Date().toISOString()
  const mode = normalizeEditorMode(note.editorMode)
  const content =
    mode === 'latex'
      ? normalizeLatexSource(note.content)
      : normalizeRichHtml(note.content)

  const id =
    typeof note.id === 'string' && note.id.length > 0
      ? note.id
      : crypto.randomUUID()

  return {
    id,
    title: typeof note.title === 'string' ? note.title : 'Untitled',
    content,
    tags: Array.isArray(note.tags)
      ? note.tags.filter((t): t is string => typeof t === 'string')
      : [],
    folder: typeof note.folder === 'string' ? note.folder : '',
    editorMode: mode,
    createdAt: typeof note.createdAt === 'string' ? note.createdAt : now,
    updatedAt: typeof note.updatedAt === 'string' ? note.updatedAt : now,
  }
}

/**
 * Pick a valid `currentNoteId` for the given note list (persisted id must still exist).
 */
export function resolveCurrentNoteId(
  notes: Note[],
  preferred: string | null | undefined
): string | null {
  if (notes.length === 0) return null
  if (
    typeof preferred === 'string' &&
    preferred.length > 0 &&
    notes.some((n) => n.id === preferred)
  ) {
    return preferred
  }
  return notes[0]!.id
}
