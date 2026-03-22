# Daftar (Scholarly Notes)

A desktop app for academics to write notes, discover papers via Semantic Scholar, and get AI-assisted research suggestions—all in one workspace.

---

## Features

- **Rich text & LaTeX** — TipTap editor with headings, lists, code blocks, blockquotes; LaTeX mode with live KaTeX preview for research papers
- **Literature sidebar** — Search Semantic Scholar, view recommendations for the current note, save references
- **AI integration** — Gemini-powered note queries (“what should I write about?”) and paper relevance scoring
- **Templates** — Literature note, research log, blank; folders and tags
- **Version history** — Restore previous drafts
- **Distraction-free mode** — Full-screen, minimal UI
- **Desktop app** — Electron on Windows, macOS, Linux

---

## Quick start

### Prerequisites

- Node.js 18+
- npm

### Run from repo root

```bash
npm install
```

**Web (backend + frontend):**
```bash
npm run dev
```
- Frontend: http://localhost:5932  
- Backend: http://localhost:8787  

**Desktop (Electron):**

1. Start the backend (for Literature tab):
   ```bash
   npm run dev --prefix backend
   ```

2. In another terminal, from `frontend/`:
   ```bash
   npm run electron:dev
   ```

> **Note:** The Literature tab (paper search, recommendations) requires the backend. Without it, you’ll see 502 errors for those APIs.

---

## Environment variables

Create `.env.local` in the repo root (optional):

| Variable | Description |
|----------|-------------|
| `SEMANTIC_SCHOLAR_API_KEY` | Higher rate limits for Semantic Scholar. Get a free key at [semanticscholar.org/product/api](https://www.semanticscholar.org/product/api). |
| `GEMINI_API_KEY` | Required for AI note queries and paper relevance. |
| `GEMINI_MODEL` | Model name (default: `gemini-2.0-flash`). |
| `PORT` | Backend port (default: `8787`). |

---

## Project structure

```
├── frontend/          # React + Vite + Electron app
│   ├── src/
│   │   ├── components/   # Editor, sidebar, layouts
│   │   ├── lib/         # Storage, literature search, Gemini API
│   │   ├── store/       # Zustand state
│   │   └── hooks/
│   ├── electron/     # Electron main process
│   └── package.json
├── backend/          # Node.js API server (Semantic Scholar proxy + Gemini)
│   └── server.mjs
├── package.json      # Root scripts (dev, build, lint)
└── .env.local        # API keys (git-ignored)
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend (web) |
| `npm run build` | Build frontend for production |
| `npm run lint` | Run ESLint |
| `npm run dev --prefix backend` | Start backend only (port 8787) |
| `npm run electron:dev` (from `frontend/`) | Start Vite + Electron desktop app |

---

## Build installers

From `frontend/`:

```bash
npm run electron:build
```

Outputs to `frontend/release/`:
- **Windows** — NSIS installer
- **macOS** — DMG
- **Linux** — AppImage

---

## Data storage

Notes, version snapshots, and saved references are stored in `localStorage` under the key `daftar-v1`. The storage layer (`frontend/src/lib/storage.ts`) can be swapped for IndexedDB or a backend.
