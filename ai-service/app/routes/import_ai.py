from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.import_ai_service import classify_transactions_with_ai

router = APIRouter(prefix="/import-ai", tags=["import-ai"])


class ImportTransactionItem(BaseModel):
    id: str
    description: str
    jar_key: str | None = None
    amount: int | float | None = None
    month: str | None = None
    notes: str | None = None


class ImportClassificationRequest(BaseModel):
    items: list[ImportTransactionItem] = Field(default_factory=list)


@router.post("/classify-transactions")
def classify_import_transactions(payload: ImportClassificationRequest) -> dict[str, Any]:
    return classify_transactions_with_ai([item.model_dump() for item in payload.items])
