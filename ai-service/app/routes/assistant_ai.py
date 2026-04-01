from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.assistant_ai_service import build_assistant_reply

router = APIRouter(prefix="/assistant-ai", tags=["assistant-ai"])


class AssistantRequest(BaseModel):
    message: str = ""
    page_title: str | None = None
    page_path: str | None = None
    app_context: dict[str, Any] = Field(default_factory=dict)


@router.post("/chat")
def chat_with_assistant(payload: AssistantRequest) -> dict[str, Any]:
    return build_assistant_reply(payload.model_dump())
