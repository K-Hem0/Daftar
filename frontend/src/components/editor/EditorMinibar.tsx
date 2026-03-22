import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import { cn } from '../../lib/cn'
import { ToolbarButton } from './toolbar/ToolbarButton'

function UndoIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path
        d="M9 14 4 9l5-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path
        d="m15 14 5-5-5-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
    </svg>
  )
}

type EditorMinibarProps = {
  editor: Editor
  distractionFree: boolean
  onToggleDistractionFree: () => void
}

export function EditorMinibar({
  editor,
  distractionFree,
  onToggleDistractionFree,
}: EditorMinibarProps) {
  const { canUndo, canRedo } = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      canUndo: ed.can().undo(),
      canRedo: ed.can().redo(),
    }),
  })

  return (
    <div
      className={cn(
        'flex items-center justify-end gap-0.5 rounded-md py-0.5',
        'text-slate-500 dark:text-slate-400'
      )}
    >
      <ToolbarButton
        title="Undo"
        disabled={!canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <UndoIcon />
      </ToolbarButton>
      <ToolbarButton
        title="Redo"
        disabled={!canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <RedoIcon />
      </ToolbarButton>
      <div className="mx-1 h-4 w-px bg-slate-200/55 dark:bg-white/[0.07]" />
      <button
        type="button"
        title="Distraction-free mode"
        aria-pressed={distractionFree}
        onClick={onToggleDistractionFree}
        className={cn(
          'rounded-md px-2 py-1 text-[11px] font-medium transition-colors duration-100',
          'hover:bg-slate-200/45 hover:text-slate-900',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25',
          'dark:hover:bg-white/[0.07] dark:hover:text-slate-100',
          distractionFree &&
            'bg-slate-200/45 text-sky-800 dark:bg-white/[0.08] dark:text-sky-300/95'
        )}
      >
        Focus
      </button>
    </div>
  )
}
