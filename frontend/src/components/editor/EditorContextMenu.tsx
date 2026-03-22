import { useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/core'
import { cn } from '../../lib/cn'
import { modSymbol } from '../../lib/platformKeys'
import { promptAndSetLink } from '../../lib/promptLinkEditor'

type EditorContextMenuProps = {
  editor: Editor
  x: number
  y: number
  onClose: () => void
}

const itemClass =
  'flex w-full items-center gap-2 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-200 ' +
  'hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors first:rounded-t-md last:rounded-b-md'

export function EditorContextMenu({
  editor,
  x,
  y,
  onClose,
}: EditorContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = () => onClose()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('click', onDocClick, { once: true })
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    ref.current?.focus()
  }, [])

  const run = (fn: () => void) => {
    fn()
    onClose()
  }

  return (
    <div
      ref={ref}
      role="menu"
      tabIndex={-1}
      className={cn(
        'fixed z-[200] min-w-[180px] rounded-md border py-0.5 shadow-lg',
        'border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/95'
      )}
      style={{ left: x, top: y }}
    >
      <button
        type="button"
        className={itemClass}
        onClick={() => run(() => editor.chain().focus().toggleBold().run())}
      >
        <span className="font-semibold">B</span>
        <span className="text-slate-500 dark:text-slate-400">Bold</span>
        <span className="ml-auto text-[10px] text-slate-400">
          {modSymbol()}B
        </span>
      </button>
      <button
        type="button"
        className={itemClass}
        onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
      >
        <span className="italic">I</span>
        <span className="text-slate-500 dark:text-slate-400">Italic</span>
        <span className="ml-auto text-[10px] text-slate-400">
          {modSymbol()}I
        </span>
      </button>
      <button
        type="button"
        className={itemClass}
        onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}
      >
        <span className="underline">U</span>
        <span className="text-slate-500 dark:text-slate-400">Underline</span>
        <span className="ml-auto text-[10px] text-slate-400">
          {modSymbol()}U
        </span>
      </button>
      <button
        type="button"
        className={itemClass}
        onClick={() => run(() => editor.chain().focus().toggleStrike().run())}
      >
        <span className="line-through text-[11px]">S</span>
        <span className="text-slate-500 dark:text-slate-400">Strikethrough</span>
      </button>
      <button
        type="button"
        className={itemClass}
        onClick={() => run(() => editor.chain().focus().toggleCode().run())}
      >
        <span className="font-mono text-[10px]">&lt;/&gt;</span>
        <span className="text-slate-500 dark:text-slate-400">Code</span>
      </button>
      <div className="my-0.5 border-t border-slate-200/50 dark:border-white/5" />
      <button
        type="button"
        className={itemClass}
        onClick={() =>
          run(() => {
            editor.chain().focus()
            promptAndSetLink(editor)
          })
        }
      >
        <span className="text-slate-500 dark:text-slate-400">Link</span>
      </button>
      <button
        type="button"
        className={itemClass}
        onClick={() => run(() => editor.chain().focus().undo().run())}
      >
        <span className="text-slate-500 dark:text-slate-400">Undo</span>
      </button>
      <button
        type="button"
        className={itemClass}
        onClick={() => run(() => editor.chain().focus().redo().run())}
      >
        <span className="text-slate-500 dark:text-slate-400">Redo</span>
      </button>
    </div>
  )
}
