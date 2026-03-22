import {
  semanticScholarPaperForGeminiRelevance,
  type SemanticScholarPaper,
} from './literatureSearch'

/** Successful POST /api/gemini/note-queries */
export type GeminiNoteQueriesResponse = {
  mainTopic: string
  refinedQuestion: string
  suggestedQueries: string[]
  missingAngles: string[]
}

/** Successful POST /api/gemini/paper-relevance */
export type GeminiPaperRelevanceResponse = {
  summary: string
  relevance: string
  methods: string[]
  limitations: string[]
  useInWriting: string
}

async function readJsonBody(r: Response): Promise<unknown> {
  try {
    return await r.json()
  } catch {
    return {}
  }
}

function errorMessageFromBody(data: unknown, status: number): string {
  const o = data as { error?: string; detail?: string }
  return (
    [o.detail, o.error].filter(Boolean).join(' — ') ||
    `Request failed (${status})`
  )
}

/**
 * POST JSON to a same-origin `/api/gemini/*` route; throws with backend error text on failure.
 */
async function postGeminiJson(path: string, body: unknown): Promise<unknown> {
  const url = new URL(path, window.location.origin)
  const r = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await readJsonBody(r)
  if (!r.ok) throw new Error(errorMessageFromBody(data, r.status))
  return data
}

function normalizeGeminiNoteQueries(raw: unknown): GeminiNoteQueriesResponse {
  const o = raw as Record<string, unknown>
  return {
    mainTopic: String(o.mainTopic ?? ''),
    refinedQuestion: String(o.refinedQuestion ?? ''),
    suggestedQueries: Array.isArray(o.suggestedQueries)
      ? o.suggestedQueries.map(String)
      : [],
    missingAngles: Array.isArray(o.missingAngles)
      ? o.missingAngles.map(String)
      : [],
  }
}

function normalizeGeminiPaperRelevance(
  raw: unknown
): GeminiPaperRelevanceResponse {
  const o = raw as Record<string, unknown>
  return {
    summary: String(o.summary ?? ''),
    relevance: String(o.relevance ?? ''),
    methods: Array.isArray(o.methods) ? o.methods.map(String) : [],
    limitations: Array.isArray(o.limitations)
      ? o.limitations.map(String)
      : [],
    useInWriting: String(o.useInWriting ?? ''),
  }
}

export async function fetchGeminiNoteQueries(input: {
  noteTitle: string
  noteContent: string
}): Promise<GeminiNoteQueriesResponse> {
  const raw = await postGeminiJson('/api/gemini/note-queries', input)
  return normalizeGeminiNoteQueries(raw)
}

export async function fetchGeminiPaperRelevance(input: {
  noteTitle: string
  noteContent: string
  paper: SemanticScholarPaper
}): Promise<GeminiPaperRelevanceResponse> {
  const raw = await postGeminiJson('/api/gemini/paper-relevance', {
    noteTitle: input.noteTitle,
    noteContent: input.noteContent,
    paper: semanticScholarPaperForGeminiRelevance(input.paper),
  })
  return normalizeGeminiPaperRelevance(raw)
}
