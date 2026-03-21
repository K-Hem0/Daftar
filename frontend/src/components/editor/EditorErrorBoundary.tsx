import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { error: Error | null }

/**
 * Prevents a TipTap / editor exception from blanking the entire workspace.
 */
export class EditorErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[EditorErrorBoundary]', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-4 px-8 pb-24 text-center">
          <p className="max-w-[28rem] text-[15px] leading-relaxed text-slate-600 dark:text-slate-500/90">
            The editor hit an error while loading this note. You can try again, or create
            a new note from the sidebar.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-lg border border-slate-200/80 bg-white px-4 py-2 text-[13px] font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-slate-200 dark:hover:bg-white/[0.08]"
          >
            Retry editor
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
