# आप्तवच · Aptavach

> *Because an echo is only as clear as its source.*

A local-first, **source-grounded** RAG assistant that answers **only** from your own
documents — and cites every source. The name is Sanskrit *āpta-vacana*: "the trustworthy
word of a reliable authority."

## Stack

- **Frontend** — Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui (Bun)
- **Backend** — FastAPI + LlamaIndex (Python 3.14, uv)
- **Models (local, free)** — Ollama: Qwen2.5 7B (generation) + bge-m3 (multilingual embeddings)
- **Vector store** — Qdrant (embedded; swappable to Qdrant Cloud via `.env`)

Everything runs locally by default; the LLM, embeddings, and vector store are each swappable
behind a provider interface, configured entirely through `.env`.

## Status

Early development — scaffolding and the backend RAG core are in place.

## Quickstart (WIP)

Prerequisites: Ollama running, with the models pulled:

    ollama pull qwen2.5:7b
    ollama pull bge-m3

Backend:

    cd api
    uv run fastapi dev app/main.py

Frontend:

    cd web
    bun dev

## License

TBD
