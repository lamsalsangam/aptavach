# Aptavach — Backend (`api/`)

FastAPI + LlamaIndex, **Python 3.14** via **uv**. Serves the REST + SSE API consumed by the
frontend (`../web`). See the root **[README](../README.md)** for setup and **[CLAUDE.md](../CLAUDE.md)**
for architecture and conventions.

## Run

```bash
uv sync
uv run fastapi dev app/main.py     # http://127.0.0.1:8000  ·  Swagger at /docs
```

Requires **Ollama** running with the models pulled (`ollama pull qwen2.5:7b` and
`ollama pull bge-m3`).

## Layout

- `app/routes/` — HTTP endpoints (thin; no logic): `projects`, `documents`, `chat`.
- `app/services/` — RAG logic: `index`, `documents`, `chat`, `projects`.
- `app/providers/` — vendor adapters behind interfaces: `llm`, `embeddings`, `vector_store`.
- `app/config.py` — `.env`-driven settings (prefix `APTAVACH_`). Copy `.env.example` → `.env`.
- `app/schemas.py` — API request/response models.

Runtime data (uploads, vector store, registry) lives in `storage/` — **gitignored**.

## Dev

```bash
uv run ruff check
uv run ruff format
```

## Config

All settings are environment variables prefixed `APTAVACH_` (see `.env.example`). Key ones:
`APTAVACH_LLM_MODEL`, `APTAVACH_EMBED_MODEL`, `APTAVACH_QDRANT_LOCATION`, `APTAVACH_CHUNK_SIZE`,
`APTAVACH_SIMILARITY_TOP_K`. Swapping a vendor = a new adapter in `app/providers/` + an `.env` flip.
