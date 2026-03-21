import { useEffect, useRef } from 'react'
import { EditorPane } from './components/editor/EditorPane'
import { EditorErrorBoundary } from './components/editor/EditorErrorBoundary'
import { NoteList } from './components/layout/NoteList'
import { Sidebar } from './components/layout/Sidebar'
import { AppShell } from './components/layout/AppShell'
import { resolveCurrentNoteId } from './lib/noteNormalization'
import { loadPersistedState, savePersistedState } from './lib/storage'
import { AUTOSAVE_TO_DISK_MS } from './lib/versionHistoryPolicy'
import { useAppStore } from './store'
import { useSettingsStore } from './store/useSettingsStore'
import {
  applyThemePreference,
  subscribeSystemTheme,
} from './lib/theme'
import { applyColorScheme } from './lib/colorScheme'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export default function App() {
  useKeyboardShortcuts()
  const notes = useAppStore((s) => s.notes)
  const versionsByNoteId = useAppStore((s) => s.versionsByNoteId)
  const currentNoteId = useAppStore((s) => s.currentNoteId)
  const skipSaveRef = useRef(true)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydratedRef = useRef(false)
  const latestRef = useRef({ notes, versionsByNoteId, currentNoteId })
  const themePreference = useSettingsStore((s) => s.themePreference)
  const colorScheme = useSettingsStore((s) => s.colorScheme)

  useEffect(() => {
    latestRef.current = { notes, versionsByNoteId, currentNoteId }
  }, [notes, versionsByNoteId, currentNoteId])

  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    const loaded = loadPersistedState()
    useAppStore.setState({
      notes: loaded.notes,
      versionsByNoteId: loaded.versionsByNoteId,
      currentNoteId: resolveCurrentNoteId(loaded.notes, loaded.currentNoteId),
    })
  }, [])

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null
      const { notes: n, versionsByNoteId: v, currentNoteId: id } =
        latestRef.current
      savePersistedState({
        notes: n,
        versionsByNoteId: v,
        currentNoteId: id,
      })
    }, AUTOSAVE_TO_DISK_MS)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [notes, versionsByNoteId, currentNoteId])

  useEffect(() => {
    const flush = () => {
      const { notes: n, versionsByNoteId: v, currentNoteId: id } =
        latestRef.current
      savePersistedState({
        notes: n,
        versionsByNoteId: v,
        currentNoteId: id,
      })
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  useEffect(() => {
    applyThemePreference(themePreference)
  }, [themePreference])

  useEffect(() => {
    applyColorScheme(colorScheme)
  }, [colorScheme])

  useEffect(() => {
    if (themePreference !== 'system') return
    return subscribeSystemTheme(() => {
      applyThemePreference('system')
    })
  }, [themePreference])

  return (
    <AppShell
      left={<NoteList />}
      editor={
        <EditorErrorBoundary>
          <EditorPane />
        </EditorErrorBoundary>
      }
      right={<Sidebar />}
    />
  )
}
