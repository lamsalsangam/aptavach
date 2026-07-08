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

**2. Install dependencies** (once):

```bash
cd api && uv sync && cd ..        # backend  (Python 3.14 via uv)
cd web && bun install && cd ..    # frontend
```

**3. Run it** — from the repo **root**, this starts the backend **and** frontend together:

```bash
bun run up        # backend + frontend in one terminal (Ollama must be running)
bun run up:all    # ...also starts `ollama serve`
```

`bun run up` auto-fetches a tiny `concurrently` helper on first run; Ctrl+C stops everything.
Then open **http://localhost:5173**, create a project, add a source, and ask a question.

<details>
<summary><b>Prefer to run the services separately?</b></summary>

```bash
# Backend  → http://127.0.0.1:8000  (Swagger UI at /docs)
cd api && uv run fastapi dev app/main.py

# Frontend → http://localhost:5173
cd web && bun dev
```
</details>

## Configuration

Backend config is `.env`-driven (prefix `APTAVACH_`). Copy `api/.env.example` → `api/.env` and edit.
Highlights:

| Key | Purpose |
|---|---|
| `APTAVACH_LLM_MODEL` / `APTAVACH_EMBED_MODEL` | Ollama model names |
| `APTAVACH_LLM_PROVIDER` / `APTAVACH_EMBED_PROVIDER` | swap vendors (add an adapter in `api/app/providers/`) |
| `APTAVACH_QDRANT_LOCATION` | `local` (embedded) or `server` (Qdrant Cloud/self-host) |
| `APTAVACH_CHUNK_SIZE` / `APTAVACH_SIMILARITY_TOP_K` | retrieval tuning |

## Models

The defaults — **Qwen2.5 7B** (generation) and **bge-m3** (embeddings) — were chosen for one
honest reason: they're **free, run fully locally, and fit modest hardware**. They aren't the newest
or largest models around; they're simply what runs comfortably without a beefy GPU or any paid API.
Aptavach is model-agnostic, so if your machine (or budget) can do better, use something better.

### Use a different Ollama model

Pull any model from the [Ollama library](https://ollama.com/library), then point Aptavach at it in
`api/.env` and restart the backend:

```env
# Generation — a stronger model if you have the VRAM, or a smaller one for weaker hardware
APTAVACH_LLM_MODEL=qwen3:8b
# Embeddings — see the caveat below before changing this
APTAVACH_EMBED_MODEL=bge-m3
```

- **More capable:** `qwen3:8b`, `llama3.1:8b`, `gemma3`, … (need more VRAM/RAM).
- **Lighter:** `qwen2.5:3b`, `llama3.2:3b` for machines that struggle with a 7B model.
- **Embeddings caveat:** a different embedder produces a different (often differently-sized) vector
  space, so the existing index is incompatible. Start fresh — stop the backend, delete
  `api/storage/`, restart — then re-upload your documents.

### Use a cloud model instead

Every model sits behind a provider interface (`api/app/providers/`), so you can swap Ollama for a
hosted API (Claude, GPT, Gemini, …): set `APTAVACH_LLM_PROVIDER` + your key in `.env`, and add a
small adapter in `providers/llm.py`. See **[CLAUDE.md](CLAUDE.md)** for the exact steps.

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

## Acknowledgements

Aptavach was designed and built collaboratively with **[Claude](https://claude.com)** (Anthropic),
using **Claude Code** — from the initial architecture and tech-stack decisions through the backend
RAG pipeline, the UI, and this documentation.

## License

[MIT](LICENSE) © 2026 Sangam Lamsal
