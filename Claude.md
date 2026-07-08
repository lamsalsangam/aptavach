# CLAUDE.md — Aptavach architecture & contributor guide

Orientation for anyone (human or AI assistant) working on this repo. **Read this before making
changes** so the codebase stays consistent. For setup/usage, see [README.md](README.md).

## What Aptavach is

A local-first, source-grounded RAG app: it answers **strictly** from user-provided documents and
cites every claim. Organized as **Projects** (Claude-style) — a project owns a set of documents,
and each chat in a project is grounded *only* in that project's documents.

## Core principles (do not violate lightly)

1. **UI is decoupled from logic.** The frontend holds no RAG logic; it talks to the backend over
   one documented **REST + SSE** contract. This is deliberate — the frontend could later be
   swapped (e.g. to Remix / React Router) without touching the backend.
2. **Vendors live behind interfaces.** The LLM, embeddings, and vector store are built by factory
   functions in `api/app/providers/`. Swapping Ollama → a cloud model, or embedded Qdrant →
   Qdrant Cloud, is a change confined to those files + `.env`. Nothing else should import a vendor
   SDK directly.
3. **Layered backend.** `routes/` (thin HTTP) → `services/` (framework-agnostic RAG logic) →
   `providers/` (vendor adapters). Dependencies point inward; routes never contain logic.

## Backend (`api/`)

- **Python 3.14** via **uv** (not the system interpreter). Run: `uv run fastapi dev app/main.py`.
- **No local torch/onnx** — all model inference goes through **Ollama over HTTP**, which keeps the
  dependency tree light and Python-version-tolerant. Don't add heavy ML libs without good reason.
- **Data model:**
  - **Projects** → `storage/projects.json` (server-side).
  - **Documents** → `storage/registry.json` maps `doc_id` → `{ project_id, filename, num_chunks,
    node_ids, ... }`; original files in `storage/uploads/`; vectors in `storage/qdrant/`. Every
    chunk carries `project_id`, `doc_id`, and `source` metadata.
  - **Chats** → **NOT server-side.** They live in the browser's `localStorage` (a deliberate,
    revisit-later choice). The chat endpoint is stateless.
- **Scoping:** retrieval is filtered by `project_id` (Qdrant `MetadataFilters`) so a chat only ever
  sees its own project's documents.
- **Citations:** after synthesis, sources weaker than `0.7 × top score` are dropped, and each
  snippet is a keyword-window around the question (see `services/chat.py`).
- **Key files:** `config.py` (settings), `schemas.py` (contracts),
  `services/{index,documents,chat,projects}.py`, `routes/{projects,documents,chat}.py`,
  `providers/{llm,embeddings,vector_store}.py`, `main.py` (app factory + CORS + router mounting).

## Frontend (`web/`)

- **Bun** + **Vite** + **React 19** (React Compiler **on** — no manual `useMemo`/`useCallback`
  needed) + **TypeScript 6** + **Tailwind v4** + **shadcn/ui** (Radix). Markdown via **Streamdown**.
- **The API seam — `src/lib/api/` is the ONLY place that calls `fetch`.**
  - `types.ts` mirrors the backend `schemas.py`.
  - `client.ts` exposes the functions (projects, documents, chat).
  - `streamChat()` parses the SSE `data: {json}` frames.
  - UI components/hooks call these functions; they never touch `fetch` directly.
- **Hooks:** `useProjects` (server), `useDocuments` (server, per project), `useChats`
  (`localStorage`, via `lib/chat-store.ts`). `App.tsx` composes them.
- **Components:** `chat/` (message, chat-input, chat-panel, markdown), `sidebar/` (project-list,
  chat-list, sidebar-rail), `documents/` (sources, document-preview), plus `app-sidebar`, `brand`,
  `help-dialog`, `theme-provider`/`theme-toggle`.

## Conventions & gotchas

- **TS is strict:** `verbatimModuleSyntax` (use `import type` for types), `erasableSyntaxOnly`
  (**no** `enum`/`namespace`/parameter-properties — use union types + `as const`), `noUnusedLocals`.
- **Tailwind v4 canonical classes:** `wrap-break-word` (not `break-words`), `data-highlighted:`
  (not `data-[highlighted]:`), `bg-linear-*` (not `bg-gradient-*`), spacing like `w-0.75`/`max-h-50`.
- **Path alias:** `@/*` → `web/src/*`.
- **shadcn/Radix:** the unified package — `import { Dialog } from 'radix-ui'`.
- **Theme:** colors are CSS variables in `src/index.css` (`:root` = light, `.dark` = dark). Style
  with the tokens (`bg-background`, `text-muted-foreground`, `border-border`, …) so both modes work.
- **`storage/` is gitignored** — never commit user data. Chat history is `localStorage`, also never
  committed. Verify with `git status` before committing.

## Common tasks

| Task | Where |
|---|---|
| Swap LLM to a cloud model | add a branch in `providers/llm.py`; set `APTAVACH_LLM_PROVIDER` + key in `.env` |
| Swap embeddings | `providers/embeddings.py` — **note:** changing the embedder requires re-indexing all docs |
| Move Qdrant to the cloud | `APTAVACH_QDRANT_LOCATION=server` + `APTAVACH_QDRANT_URL`/`_API_KEY` |
| Add an API endpoint | service fn in `services/` → thin route in `routes/` → schema in `schemas.py` → client fn in `web/src/lib/api/client.ts` |
| Add a shadcn component | `bunx shadcn@latest add <name>` (in `web/`) |
| Tune retrieval | `APTAVACH_CHUNK_SIZE`, `APTAVACH_SIMILARITY_TOP_K` (re-upload docs after chunk-size changes) |

## Commands

```bash
# Everything at once (from repo root)
bun run up           # backend + frontend    (bun run up:all also starts Ollama)

# Models (Ollama must be running)
ollama serve
ollama pull qwen2.5:7b && ollama pull bge-m3

# Backend (from api/)
uv run fastapi dev app/main.py
uv run ruff check   ·   uv run ruff format

# Frontend (from web/)
bun dev   ·   bun run build   ·   bun run lint
```
