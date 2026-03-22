import http from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GoogleGenerativeAI } from '@google/generative-ai'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadParentEnv() {
  for (const name of ['.env.local', '.env']) {
    const p = resolve(__dirname, '..', name)
    if (!existsSync(p)) continue
    let text = readFileSync(p, 'utf8')
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i === -1) continue
      const k = t.slice(0, i).trim()
      let v = t.slice(i + 1).trim()
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1)
      }
      const cur = process.env[k]
      if (cur === undefined || cur === '') process.env[k] = v
    }
  }
}

loadParentEnv()

const PORT = Number(process.env.PORT || 8787)
const SEMANTIC_SCHOLAR_API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY || ''
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

const MAX_BODY_BYTES = 512 * 1024
const MAX_NOTE_CONTENT_CHARS = 16000
const MAX_NOTE_TITLE_CHARS = 500

async function ssFetch(pathAndQuery) {
  const url = new URL(pathAndQuery, 'https://api.semanticscholar.org')
  const headers = { Accept: 'application/json' }
  if (SEMANTIC_SCHOLAR_API_KEY) headers['x-api-key'] = SEMANTIC_SCHOLAR_API_KEY
  const r = await fetch(url, { headers })
  const body = await r.text()
  return { status: r.status, body }
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(obj))
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<unknown>}
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let total = 0
    req.on('data', (chunk) => {
      total += chunk.length
      if (total > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        if (!raw.trim()) {
          resolve(null)
          return
        }
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', (e) => reject(e))
  })
}

function clipText(s, max) {
  if (typeof s !== 'string') return ''
  return s.length > max ? `${s.slice(0, max)}\n…[truncated]` : s
}

function extractJsonFromModelText(text) {
  let s = (text || '').trim()
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im
  const m = s.match(fence)
  if (m) s = m[1].trim()
  return JSON.parse(s)
}

/**
 * @param {string} systemInstruction
 * @param {string} userText
 */
async function runGeminiJson(systemInstruction, userText) {
  if (!GEMINI_API_KEY) {
    const e = new Error(
      'GEMINI_API_KEY is not configured. Add it to .env.local (repo root).'
    )
    e.code = 'NO_KEY'
    throw e
  }
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.35,
    },
    systemInstruction,
  })
  const result = await model.generateContent(userText)
  const text = result.response.text()
  return extractJsonFromModelText(text)
}

function geminiErrorMessage(err) {
  const msg = err && typeof err.message === 'string' ? err.message : String(err)
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(msg)) {
    return 'Gemini rate limit or quota exceeded. Try again later.'
  }
  if (/401|403|API key|PERMISSION_DENIED/i.test(msg)) {
    return 'Gemini rejected the request. Check GEMINI_API_KEY and API access.'
  }
  if (/404|not found|model/i.test(msg)) {
    return `Model may be unavailable. Try setting GEMINI_MODEL (current: ${GEMINI_MODEL}).`
  }
  return msg.length > 200 ? `${msg.slice(0, 200)}…` : msg
}

function normalizeNoteQueries(obj) {
  if (obj === null || typeof obj !== 'object') {
    throw new Error('Model returned invalid JSON shape')
  }
  const o = /** @type {Record<string, unknown>} */ (obj)
  return {
    mainTopic: String(o.mainTopic ?? ''),
    refinedQuestion: String(o.refinedQuestion ?? ''),
    suggestedQueries: Array.isArray(o.suggestedQueries)
      ? o.suggestedQueries.map((x) => String(x))
      : [],
    missingAngles: Array.isArray(o.missingAngles)
      ? o.missingAngles.map((x) => String(x))
      : [],
  }
}

function normalizePaperRelevance(obj) {
  if (obj === null || typeof obj !== 'object') {
    throw new Error('Model returned invalid JSON shape')
  }
  const o = /** @type {Record<string, unknown>} */ (obj)
  return {
    summary: String(o.summary ?? ''),
    relevance: String(o.relevance ?? ''),
    methods: Array.isArray(o.methods) ? o.methods.map((x) => String(x)) : [],
    limitations: Array.isArray(o.limitations)
      ? o.limitations.map((x) => String(x))
      : [],
    useInWriting: String(o.useInWriting ?? ''),
  }
}

async function handleGeminiNoteQueries(body) {
  const noteTitle = clipText(String(body?.noteTitle ?? ''), MAX_NOTE_TITLE_CHARS)
  const noteContent = clipText(
    String(body?.noteContent ?? ''),
    MAX_NOTE_CONTENT_CHARS
  )
  const system =
    'You help researchers sharpen literature search. Reply with JSON only (no markdown). All string values must be plain text.'
  const user = `Analyze this note and respond with a single JSON object with exactly these keys:
- "mainTopic": one concise string (the core subject).
- "refinedQuestion": one concrete research question suitable for literature search.
- "suggestedQueries": array of 3–8 short keyword-style queries for an academic search engine.
- "missingAngles": array of 2–6 strings: perspectives, methods, or subtopics the note barely mentions but might matter.

Note title:
${noteTitle || '(empty)'}

Note content:
${noteContent || '(empty)'}`
  const raw = await runGeminiJson(system, user)
  return normalizeNoteQueries(raw)
}

async function handleGeminiPaperRelevance(body) {
  const noteTitle = clipText(String(body?.noteTitle ?? ''), MAX_NOTE_TITLE_CHARS)
  const noteContent = clipText(
    String(body?.noteContent ?? ''),
    MAX_NOTE_CONTENT_CHARS
  )
  const paper = body?.paper
  if (paper === null || typeof paper !== 'object') {
    const e = new Error('Missing or invalid "paper" object')
    e.code = 'BAD_INPUT'
    throw e
  }
  const p = /** @type {Record<string, unknown>} */ (paper)
  const title = clipText(String(p.title ?? ''), 800)
  const abstract = clipText(String(p.abstract ?? ''), 8000)
  const authors = Array.isArray(p.authors) ? p.authors.map((a) => String(a)) : []
  const year =
    typeof p.year === 'number' && Number.isFinite(p.year) ? p.year : null
  const venue = clipText(String(p.venue ?? ''), 400)
  const url = clipText(String(p.url ?? ''), 2000)

  const system =
    'You connect academic papers to a writer\'s note. Reply with JSON only (no markdown). Be concise and practical.'
  const user = `The user is writing a note. Explain how the paper below relates (or does not) to their note.

Respond with a single JSON object with exactly these keys:
- "summary": 2–4 sentences summarizing the paper for the writer.
- "relevance": 2–5 sentences on why the paper matters (or not) for their note.
- "methods": array of 2–6 short strings about methods or evidence types in the paper.
- "limitations": array of 2–5 short strings: caveats, scope limits, or reasons to be cautious.
- "useInWriting": one short paragraph on how they might use or cite this note in their writing (or skip it).

Note title:
${noteTitle || '(empty)'}

Note content:
${noteContent || '(empty)'}

Paper title: ${title || '(unknown)'}
Authors: ${authors.length ? authors.join(', ') : '(unknown)'}
Year: ${year === null ? 'unknown' : String(year)}
Venue: ${venue || '(unknown)'}
URL: ${url || '(none)'}
Abstract:
${abstract || '(none provided)'}`

  const raw = await runGeminiJson(system, user)
  return normalizePaperRelevance(raw)
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const host = req.headers.host || 'localhost'
  const u = new URL(req.url || '/', `http://${host}`)

  try {
    if (req.method === 'GET' && u.pathname === '/api/paper-search') {
      const q = u.searchParams.get('query') || u.searchParams.get('q') || ''
      const limit = u.searchParams.get('limit') || '15'
      const fields =
        'paperId,title,authors,year,abstract,url,citationCount,venue,openAccessPdf,externalIds'
      const path = `/graph/v1/paper/search?query=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}&fields=${encodeURIComponent(fields)}`
      const { status, body } = await ssFetch(path)
      if (status === 429) {
        res.writeHead(429, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            error:
              'Semantic Scholar rate limit exceeded. Add SEMANTIC_SCHOLAR_API_KEY to .env.local for higher limits (get a free key at semanticscholar.org/product/api).',
          })
        )
        return
      }
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(body)
      return
    }

    if (req.method === 'GET' && u.pathname === '/api/paper-recommendations') {
      const id = u.searchParams.get('paperId')
      if (!id) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'paperId required' }))
        return
      }
      const limit = u.searchParams.get('limit') || '10'
      const fields =
        'paperId,title,authors,year,abstract,url,citationCount,venue,openAccessPdf'
      const path = `/recommendations/v1/papers/forpaper/${encodeURIComponent(id)}?limit=${encodeURIComponent(limit)}&fields=${encodeURIComponent(fields)}`
      const { status, body } = await ssFetch(path)
      if (status === 429) {
        res.writeHead(429, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            error:
              'Semantic Scholar rate limit exceeded. Add SEMANTIC_SCHOLAR_API_KEY to .env.local for higher limits (get a free key at semanticscholar.org/product/api).',
          })
        )
        return
      }
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(body)
      return
    }

    if (req.method === 'POST' && u.pathname === '/api/gemini/note-queries') {
      if (!GEMINI_API_KEY) {
        sendJson(res, 503, {
          error:
            'Gemini is not configured. Set GEMINI_API_KEY in the environment (e.g. repo root .env.local).',
        })
        return
      }
      let body
      try {
        body = await readJsonBody(req)
      } catch (e) {
        sendJson(res, 400, { error: e.message || 'Bad request' })
        return
      }
      try {
        const out = await handleGeminiNoteQueries(body ?? {})
        sendJson(res, 200, out)
      } catch (e) {
        console.error('[gemini note-queries]', e)
        if (e.code === 'NO_KEY') {
          sendJson(res, 503, { error: e.message })
          return
        }
        sendJson(res, 502, {
          error: 'Gemini request failed',
          detail: geminiErrorMessage(e),
        })
      }
      return
    }

    if (req.method === 'POST' && u.pathname === '/api/gemini/paper-relevance') {
      if (!GEMINI_API_KEY) {
        sendJson(res, 503, {
          error:
            'Gemini is not configured. Set GEMINI_API_KEY in the environment (e.g. repo root .env.local).',
        })
        return
      }
      let body
      try {
        body = await readJsonBody(req)
      } catch (e) {
        sendJson(res, 400, { error: e.message || 'Bad request' })
        return
      }
      try {
        const out = await handleGeminiPaperRelevance(body ?? {})
        sendJson(res, 200, out)
      } catch (e) {
        console.error('[gemini paper-relevance]', e)
        if (e.code === 'NO_KEY') {
          sendJson(res, 503, { error: e.message })
          return
        }
        if (e.code === 'BAD_INPUT') {
          sendJson(res, 400, { error: e.message })
          return
        }
        sendJson(res, 502, {
          error: 'Gemini request failed',
          detail: geminiErrorMessage(e),
        })
      }
      return
    }

    if (req.method === 'GET' && u.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          ok: true,
          geminiConfigured: Boolean(GEMINI_API_KEY),
        })
      )
      return
    }

    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'not found' }))
  } catch (e) {
    console.error(e)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: String(e?.message || e) }))
  }
})

server.listen(PORT, () => {
  console.log(`[backend] http://localhost:${PORT}`)
  console.log(
    `[backend] Semantic Scholar proxy: /api/paper-search, /api/paper-recommendations`
  )
  console.log(
    `[backend] Gemini: ${GEMINI_API_KEY ? 'enabled' : 'disabled (set GEMINI_API_KEY)'} → /api/gemini/note-queries, /api/gemini/paper-relevance`
  )
})
