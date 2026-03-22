import type { EditorMode, NoteTemplateId } from '../types'

export type TemplateCategoryId = 'core' | 'research' | 'writing'

export type NoteTemplateOptions = Record<string, never>

export type NoteTemplatePayload = {
  title: string
  /** Rich-text HTML or raw `.tex` source, per `editorMode`. */
  body: string
  editorMode: EditorMode
  /** Empty string = inbox / uncategorized */
  folder: string
  tags: string[]
}

function formatLongDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(d)
}

/** Markdown templates for notes (supports LaTeX: $...$, $$...$$). */
function mdDailyLectureBody(dateLine: string): string {
  return (
    `## Session details\n\n**Date** — ${dateLine}\n\n**Course** — \n\n**Topic** — \n\n---\n\n` +
    `## Key Ideas\n\n- \n\n## Examples\n\n\n\n## Questions\n\n- \n\n## Summary\n\n`
  )
}

function mdResearchPaperBody(): string {
  return (
    `# Provisional title\n\n*One-sentence summary of the paper's central claim.*\n\n` +
    `## Topic\n\n\n\n## Research Question\n\n\n\n## Thesis\n\n\n\n## Introduction\n\n\n\n` +
    `## Main Argument\n\n\n\n## Evidence\n\n\n\n## Counterargument\n\n\n\n## Conclusion\n\n\n\n## Sources\n\n- `
  )
}

function mdBlogPostBody(dateLine: string): string {
  return (
    `> *Add a compelling subtitle for readers…*\n\n` +
    `**Author** — \n\n**Date** — ${dateLine}\n\n**Tags** — \n\n---\n\n` +
    `## Hook\n\n\n\n## Main Point\n\n\n\n## Supporting Sections\n\n### First angle\n\n\n\n### Second angle\n\n\n\n### Third angle\n\n\n\n## Closing\n\n`
  )
}

export type NoteTemplateDefinition = {
  id: NoteTemplateId
  label: string
  shortLabel: string
  category: TemplateCategoryId
  hint?: string
  folder: string
  tags: string[]
  build: () => Pick<NoteTemplatePayload, 'title' | 'body' | 'editorMode'>
}

export const NOTE_TEMPLATE_DEFINITIONS: NoteTemplateDefinition[] = [
  {
    id: 'blank',
    label: 'Blank note',
    shortLabel: 'Blank',
    category: 'core',
    hint: 'Empty body — fastest start',
    folder: '',
    tags: [],
    build: () => ({
      title: 'Untitled',
      editorMode: 'rich',
      body: '<p></p>',
    }),
  },
  {
    id: 'daily-lecture',
    label: 'Daily / Lecture note',
    shortLabel: 'Daily',
    category: 'core',
    hint: 'Dated class outline: session meta, then ideas → summary',
    folder: 'Lecture',
    tags: ['lecture', 'class'],
    build: () => {
      const today = formatLongDate(new Date())
      return {
        title: `Lecture Note — ${today}`,
        editorMode: 'latex',
        body: mdDailyLectureBody(today),
      }
    },
  },
  {
    id: 'research-paper',
    label: 'Research paper',
    shortLabel: 'Research',
    category: 'research',
    hint: 'Formal outline with headings and sections',
    folder: 'Research',
    tags: ['research', 'paper'],
    build: () => ({
      title: 'Research Paper Draft',
      editorMode: 'latex',
      body: mdResearchPaperBody(),
    }),
  },
  {
    id: 'blog-post',
    label: 'Blog post',
    shortLabel: 'Blog',
    category: 'writing',
    hint: 'Article draft: subtitle block, meta, hook → closing',
    folder: 'Writing',
    tags: ['blog'],
    build: () => {
      const today = formatLongDate(new Date())
      return {
        title: 'New Blog Post',
        editorMode: 'latex',
        body: mdBlogPostBody(today),
      }
    },
  },
]

const defById = new Map(
  NOTE_TEMPLATE_DEFINITIONS.map((d) => [d.id, d] as const)
)

export function getNoteTemplatePayload(
  id: NoteTemplateId,
  _options?: NoteTemplateOptions
): NoteTemplatePayload {
  const def = defById.get(id) ?? defById.get('blank')!
  const { title, body, editorMode } = def.build()
  return {
    title,
    body,
    editorMode,
    folder: def.folder,
    tags: [...def.tags],
  }
}
