"""Streaming, source-grounded answering — scoped to a single project. Retrieval is filtered to
the project's documents, runs in a threadpool, and every answer is followed by its citations."""
import json
import re
from collections.abc import AsyncGenerator

from llama_index.core import PromptTemplate
from llama_index.core.vector_stores import MetadataFilter, MetadataFilters
from starlette.concurrency import iterate_in_threadpool, run_in_threadpool

from ..config import get_settings
from .documents import has_documents
from .index import get_index

_QA_TEMPLATE = PromptTemplate(
    "You are Aptavach, an assistant that answers strictly from the provided sources.\n"
    "Sources are below.\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Using ONLY these sources and not any prior knowledge, answer the question. "
    "If the sources do not contain the answer, say so plainly rather than guessing. "
    "Be clear and concise.\n"
    "Question: {query_str}\n"
    "Answer: "
)

# Citations weaker than this fraction of the top match are hidden as noise.
_CITATION_SCORE_RATIO = 0.7


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _snippet(text: str, query: str, size: int = 320) -> str:
    """Show the part of a chunk around the question's keywords, not just its opening."""
    lowered = text.lower()
    keywords = [w for w in re.findall(r"[a-z0-9]+", query.lower()) if len(w) > 3]
    pos = -1
    for keyword in keywords:
        for probe in (keyword, keyword[:4]):  # crude stem so "hobby" still finds "hobbies"
            found = lowered.find(probe)
            if found != -1:
                pos = found
                break
        if pos != -1:
            break

    if pos == -1:
        return text[:size].strip()

    start = max(0, pos - size // 3)
    end = min(len(text), start + size)
    prefix = "… " if start > 0 else ""
    suffix = " …" if end < len(text) else ""
    return f"{prefix}{text[start:end].strip()}{suffix}"


async def stream_answer(
    project_id: str, message: str, top_k: int | None = None
) -> AsyncGenerator[str, None]:
    settings = get_settings()

    if not has_documents(project_id):
        yield _sse(
            {
                "type": "token",
                "text": "This project has no sources yet. Add a document and "
                "I'll answer strictly from it.",
            }
        )
        yield _sse({"type": "done"})
        return

    # Retrieve only from documents that belong to this project.
    filters = MetadataFilters(filters=[MetadataFilter(key="project_id", value=project_id)])
    query_engine = get_index().as_query_engine(
        streaming=True,
        similarity_top_k=top_k or settings.similarity_top_k,
        filters=filters,
        text_qa_template=_QA_TEMPLATE,
    )

    response = await run_in_threadpool(query_engine.query, message)

    async for token in iterate_in_threadpool(response.response_gen):
        yield _sse({"type": "token", "text": token})

    sources = response.source_nodes
    top_score = max((s.score for s in sources if s.score is not None), default=0.0)
    threshold = top_score * _CITATION_SCORE_RATIO

    citations = []
    for source in sources:
        score = source.score
        # Skip clearly-weaker matches so only what actually grounds the answer is shown.
        if score is not None and top_score > 0 and score < threshold:
            continue
        meta = source.node.metadata or {}
        citations.append(
            {
                "id": len(citations) + 1,
                "source": meta.get("source") or meta.get("file_name") or "unknown",
                "page": meta.get("page_label"),
                "score": round(float(score), 4) if score is not None else None,
                "text": _snippet(source.node.get_content(), message),
            }
        )

    yield _sse({"type": "sources", "sources": citations})
    yield _sse({"type": "done"})
