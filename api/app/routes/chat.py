from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ..schemas import ChatRequest
from ..services.chat import stream_answer

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("")
async def chat(request: ChatRequest) -> StreamingResponse:
    return StreamingResponse(
        stream_answer(request.message, request.top_k),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
