"""Streaming, source-grounded answering. Retrieval + synthesis run in a threadpool so the
async SSE endpoint stays responsive; every answer is followed by its citations."""
import json
from collections.abc import AsyncGenerator

from llama_index.core import PromptTemplate
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


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


async def stream_answer(
    message: str, top_k: int | None = None
) -> AsyncGenerator[str, None]:
    settings = get_settings()

    if not has_documents():
        yield _sse(
            {
                "type": "token",
                "text": "No sources have been added yet. Upload a document and "
                "I'll answer strictly from it.",
            }
        )
        yield _sse({"type": "done"})
        return

    query_engine = get_index().as_query_engine(
        streaming=True,
        similarity_top_k=top_k or settings.similarity_top_k,
        text_qa_template=_QA_TEMPLATE,
    )

    response = await run_in_threadpool(query_engine.query, message)

    async for token in iterate_in_threadpool(response.response_gen):
        yield _sse({"type": "token", "text": token})

    citations = []
    for i, source in enumerate(response.source_nodes, start=1):
        meta = source.node.metadata or {}
        citations.append(
            {
                "id": i,
                "source": meta.get("source") or meta.get("file_name") or "unknown",
                "page": meta.get("page_label"),
                "score": round(float(source.score), 4) if source.score is not None else None,
                "text": source.node.get_content()[:500],
            }
        )
    yield _sse({"type": "sources", "sources": citations})
    yield _sse({"type": "done"})
