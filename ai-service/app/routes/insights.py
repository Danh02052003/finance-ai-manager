from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.insights_service import (
    build_savings_suggestions,
    build_spending_anomalies,
    build_summary_insight,
)

router = APIRouter(prefix="/insights", tags=["insights"])


class InsightRequest(BaseModel):
    user_id: str | None = Field(default=None)
    month: str | None = Field(default=None, description="Expected format: YYYY-MM")
    context: dict[str, Any] = Field(default_factory=dict)


@router.post("/summary")
def create_summary_insight(payload: InsightRequest) -> dict[str, Any]:
    return build_summary_insight(payload.model_dump())


@router.post("/spending-anomalies")
def create_spending_anomalies(payload: InsightRequest) -> dict[str, Any]:
    return build_spending_anomalies(payload.model_dump())


@router.post("/savings-suggestions")
def create_savings_suggestions(payload: InsightRequest) -> dict[str, Any]:
    return build_savings_suggestions(payload.model_dump())
