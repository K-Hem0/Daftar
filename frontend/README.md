# Daftar — Frontend

React + TypeScript + Vite + Electron app. See the [root README](../README.md) for full documentation.

## Run

```bash
npm install
```

- **Web:** `npm run dev` — Vite at http://localhost:5932. Literature APIs are proxied to the backend on port 8787.
- **Desktop:** `npm run electron:dev` — Starts Vite and launches Electron. For the Literature tab, run the backend from the repo root: `npm run dev --prefix backend`.

## Build

```bash
npm run build
npm run electron:build   # Build installers (NSIS, DMG, AppImage)
```

## Stack

- **Editor:** TipTap (rich text) + CodeMirror (LaTeX)
- **Styling:** Tailwind v4
- **State:** Zustand
- **Storage:** localStorage (`daftar-v1`)
