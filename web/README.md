# Aptavach — Frontend (`web/`)

Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui, run with **Bun**. This is the UI only —
all RAG logic lives in the backend (`../api`). See the root **[README](../README.md)** for setup
and **[CLAUDE.md](../CLAUDE.md)** for architecture and conventions.

## Commands

```bash
bun install     # install dependencies
bun dev         # dev server → http://localhost:5173
bun run build   # typecheck + production build
bun run lint    # Oxlint
```

Requires the **backend running** (default `http://127.0.0.1:8000`) and **Ollama** up.

## Structure

- `src/lib/api/` — the only code that talks to the backend (REST + SSE). Override the base URL
  with the `VITE_API_URL` env var.
- `src/hooks/` — `useProjects`, `useDocuments`, `useChats` (chat history in `localStorage`).
- `src/components/` — `chat/`, `sidebar/`, `documents/`, and shared UI.
- `src/index.css` — Tailwind entry + theme tokens (`:root` light, `.dark` dark) + keyframes.

## Notes

- React Compiler is enabled — avoid manual `useMemo`/`useCallback`.
- TypeScript is strict (`verbatimModuleSyntax`, `erasableSyntaxOnly`): use `import type`, and no
  `enum`/`namespace`. Path alias `@/*` → `src/*`.
