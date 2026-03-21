import type { EditorMode, Note, NoteVersion } from '../types'
import { normalizeNoteForApp } from './noteNormalization'
import { normalizePersistedNote } from './noteMigration'
import {
  LEGACY_NOTES_KEY,
  STORAGE_ROOT_KEY,
  type PersistedAppStateV1,
} from './schema'

function isEditorMode(v: unknown): v is EditorMode {
  return v === 'rich' || v === 'latex'
}

function isNote(value: unknown): value is Note {
  if (value === null || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    typeof o.content === 'string' &&
    Array.isArray(o.tags) &&
    o.tags.every((t) => typeof t === 'string') &&
    typeof o.folder === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string' &&
    (o.editorMode === undefined || isEditorMode(o.editorMode))
  )
}

function isNoteVersion(value: unknown): value is NoteVersion {
  if (value === null || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.content === 'string'
  )
}

function isPersistedV1(value: unknown): value is PersistedAppStateV1 {
  if (value === null || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  if (o.version !== 1) return false
  if (!Array.isArray(o.notes)) return false
  if (!o.notes.every(isNote)) return false
  if (typeof o.versionsByNoteId !== 'object' || o.versionsByNoteId === null)
    return false
  const map = o.versionsByNoteId as Record<string, unknown>
  for (const k of Object.keys(map)) {
    const arr = map[k]
    if (!Array.isArray(arr) || !arr.every(isNoteVersion)) return false
  }
  if ('currentNoteId' in o) {
    const c = o.currentNoteId
    if (c != null && typeof c !== 'string') return false
  }
  return true
}

function loadLegacyNotesOnly(): Note[] {
  const raw = localStorage.getItem(LEGACY_NOTES_KEY)
  if (raw == null) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isNote)
  } catch {
    return []
  }
}

export function loadPersistedState(): {
  notes: Note[]
  versionsByNoteId: Record<string, NoteVersion[]>
  currentNoteId?: string | null
} {
  const raw = localStorage.getItem(STORAGE_ROOT_KEY)
  if (raw != null) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isPersistedV1(parsed)) {
        return {
          notes: parsed.notes.map((n) =>
            normalizeNoteForApp(normalizePersistedNote(n))
          ),
          versionsByNoteId: parsed.versionsByNoteId,
          currentNoteId: parsed.currentNoteId,
        }
      }
    } catch {
      /* fall through */
    }
  }

  const legacy = loadLegacyNotesOnly()
  if (legacy.length > 0) {
    return {
      notes: legacy.map((n) =>
        normalizeNoteForApp(normalizePersistedNote(n))
      ),
      versionsByNoteId: {},
    }
  }

  return { notes: [], versionsByNoteId: {} }
}

export function savePersistedState(state: {
  notes: Note[]
  versionsByNoteId: Record<string, NoteVersion[]>
  currentNoteId?: string | null
}): void {
  const payload: PersistedAppStateV1 = {
    version: 1,
    notes: state.notes,
    versionsByNoteId: state.versionsByNoteId,
    currentNoteId: state.currentNoteId,
  }
  localStorage.setItem(STORAGE_ROOT_KEY, JSON.stringify(payload))
  localStorage.removeItem(LEGACY_NOTES_KEY)
}

/** @deprecated Use savePersistedState — kept for any external callers */
export function saveNotes(notes: Note[]): void {
  savePersistedState({ notes, versionsByNoteId: {}, currentNoteId: null })
}

/** @deprecated Use loadPersistedState */
export function loadNotes(): Note[] {
  return loadPersistedState().notes
}

export function exportStateJson(state: {
  notes: Note[]
  versionsByNoteId: Record<string, NoteVersion[]>
  currentNoteId?: string | null
}): string {
  return JSON.stringify(
    {
      version: 1 as const,
      notes: state.notes,
      versionsByNoteId: state.versionsByNoteId,
      currentNoteId: state.currentNoteId,
    },
    null,
    2
  )
}

export function parseImportedStateJson(
  raw: string
): {
  notes: Note[]
  versionsByNoteId: Record<string, NoteVersion[]>
  currentNoteId?: string | null
} | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (isPersistedV1(parsed)) {
      return {
        notes: parsed.notes.map((n) =>
          normalizeNoteForApp(normalizePersistedNote(n))
        ),
        versionsByNoteId: parsed.versionsByNoteId,
        currentNoteId: parsed.currentNoteId,
      }
    }
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { notes?: unknown }).notes) &&
      (parsed as { notes: unknown[] }).notes.every(isNote)
    ) {
      const loose = parsed as {
        notes: Note[]
        versionsByNoteId?: Record<string, NoteVersion[]>
        currentNoteId?: unknown
      }
      const c = loose.currentNoteId
      const currentNoteId =
        c === null || c === undefined
          ? c
          : typeof c === 'string'
            ? c
            : undefined
      return {
        notes: loose.notes.map((n) =>
          normalizeNoteForApp(normalizePersistedNote(n))
        ),
        versionsByNoteId:
          typeof loose.versionsByNoteId === 'object' &&
          loose.versionsByNoteId !== null
            ? loose.versionsByNoteId
            : {},
        ...(currentNoteId !== undefined ? { currentNoteId } : {}),
      }
    }
  } catch {
    return null
  }
  return null
}
