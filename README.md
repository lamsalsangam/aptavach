# आप्तवच · Aptavach

> *Because an echo is only as clear as its source.*

**Aptavach** is a local-first, **source-grounded** RAG assistant. It answers questions **only**
from documents you give it, and **cites every claim** — never from outside knowledge. The name
is Sanskrit *āpta-vacana* ("the trustworthy word of a reliable authority"), a recognized means
of valid knowledge in Indian epistemology.

Everything runs on your machine by default (Ollama + Qdrant) — your documents never leave your
computer, and there are no API keys or bills.

---

## Features

- **Projects** — Claude-style workspaces. Each project holds its own documents, and every chat
  inside it is grounded *only* in that project's sources. Keep "Thesis" and "Tax 2025" separate.
- **Source-grounded answers** with inline **citations** — filename, page, match %, and the
  passage used. If the sources don't contain the answer, Aptavach says so instead of guessing.
- **Streaming** replies rendered as rich **Markdown** (tables, lists, code) via Streamdown.
- **Document viewer** — click a source to read the extracted text, or open the original file.
- **Local & private** — generation, embeddings, and vectors all run locally. No cloud, no keys.
- **Swappable providers** — flip the LLM, embeddings, or vector store via `.env` (e.g. Ollama →
  a cloud model, embedded Qdrant → Qdrant Cloud) with no code changes.
- **Multilingual** — bge-m3 embeddings understand many languages.
- **Polished UI** — light/dark, responsive with a mobile drawer, a collapsible sidebar rail, and
  copy buttons on every message.

## Architecture

Two independent apps that meet at exactly one documented HTTP contract:

```
web/  (Vite + React)  ──REST + SSE──▶  api/  (FastAPI + LlamaIndex)
                                          ├─ Ollama   — LLM + embeddings
                                          └─ Qdrant   — vector store
```

The UI contains **zero** RAG logic; the backend contains **zero** UI. Vendors sit behind provider
interfaces so they can be swapped from `.env`. See **[CLAUDE.md](CLAUDE.md)** for the full picture.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vite 8, React 19 (+ React Compiler), TypeScript 6, Tailwind v4, shadcn/ui (Radix), Streamdown — run with **Bun** |
| Backend | FastAPI, LlamaIndex, Python 3.14 (via **uv**) |
| Models | Ollama — **Qwen2.5 7B** (generation), **bge-m3** (embeddings) |
| Vector store | **Qdrant** (embedded local; swappable to Qdrant Cloud) |
| Chat history | Browser `localStorage` (projects + documents are server-side) |

## Prerequisites

- **[Ollama](https://ollama.com)** — for local generation + embeddings
- **[Bun](https://bun.sh)** ≥ 1.3
- **[uv](https://docs.astral.sh/uv/)** — Python package/venv manager
- ~6 GB disk for the models. An NVIDIA GPU (8 GB+ VRAM) is ideal; CPU works but is slower.

## Setup

**1. Pull the models** (with Ollama running):

```bash
ollama pull qwen2.5:7b
ollama pull bge-m3
```

**2. Backend:**

```bash
cd api
uv sync
uv run fastapi dev app/main.py     # http://127.0.0.1:8000  ·  API docs at /docs
```

**3. Frontend** (new terminal):

```bash
cd web
bun install
bun dev                            # http://localhost:5173
```

> **Or run both at once:** from the repo root, **`bun run up`** starts the backend **and**
> frontend together in one terminal (it auto-fetches a tiny `concurrently` helper on first run;
> Ollama must be running). Use **`bun run up:all`** to launch Ollama too.

Open **http://localhost:5173**, create a project, add a source, and ask a question.

## Configuration

Backend config is `.env`-driven (prefix `APTAVACH_`). Copy `api/.env.example` → `api/.env` and edit.
Highlights:

| Key | Purpose |
|---|---|
| `APTAVACH_LLM_MODEL` / `APTAVACH_EMBED_MODEL` | Ollama model names |
| `APTAVACH_LLM_PROVIDER` / `APTAVACH_EMBED_PROVIDER` | swap vendors (add an adapter in `api/app/providers/`) |
| `APTAVACH_QDRANT_LOCATION` | `local` (embedded) or `server` (Qdrant Cloud/self-host) |
| `APTAVACH_CHUNK_SIZE` / `APTAVACH_SIMILARITY_TOP_K` | retrieval tuning |

## How it works

1. **Ingest** — an upload is parsed, split into chunks, embedded (bge-m3), and stored in Qdrant,
   each chunk tagged with its `project_id`.
2. **Retrieve** — your question is embedded and matched against chunks *within that project only*
   (a Qdrant metadata filter).
3. **Answer** — the LLM answers strictly from the retrieved chunks (streamed), then the citations
   are shown.

## Project structure

```
aptavach/
├── api/                    FastAPI + LlamaIndex backend
│   └── app/
│       ├── routes/         thin HTTP endpoints
│       ├── services/       RAG logic (index, documents, chat, projects)
│       ├── providers/      vendor adapters (llm, embeddings, vector_store)
│       ├── config.py       .env-driven settings
│       └── schemas.py      API request/response contracts
├── web/                    Vite + React frontend
│   └── src/
│       ├── lib/api/        the ONLY place that talks to the backend
│       ├── hooks/          useProjects · useChats · useDocuments
│       └── components/     chat · sidebar · documents · shared UI
├── CLAUDE.md               architecture & contributor guide
└── README.md
```

## Data & privacy

- Documents, the vector store, and the registry live in `api/storage/` — **gitignored**, never
  committed.
- Chat history lives in your browser's `localStorage`.
- In the default all-local configuration, nothing is sent to any external service.

## Roadmap

- Sentence-window retrieval for pinpoint (exact-sentence) citations
- Optional reranking for higher retrieval quality
- Cloud-provider adapters (Gemini / Claude / OpenAI) behind the existing `.env` switch
- Optional backend persistence for chat history (cross-device)

## License

[MIT](LICENSE) © 2026 Sangam Lamsal
