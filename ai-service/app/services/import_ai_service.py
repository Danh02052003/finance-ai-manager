import json
import re
from typing import Any

from app.services.provider_chain import ask_provider_chain


ALLOWED_CATEGORIES = {
    "food_drink",
    "bills",
    "investment",
    "learning",
    "family",
    "charity",
    "uncategorized",
}


def _build_prompt(items: list[dict[str, Any]]) -> str:
    return (
        "You classify Vietnamese personal finance transactions for a 6-jar budgeting app.\n"
        "Each item is already one transaction.\n"
        "Allowed categories only: food_drink, bills, investment, learning, family, charity, uncategorized.\n"
        "Use description as the main signal. If uncertain choose uncategorized.\n"
        "Important hints for Vietnamese shorthand:\n"
        "- 4g, 5g, nap dt, nap dien thoai, netflix, internet, wifi => bills\n"
        "- cf, cafe, ca phe, tra sua, bun, chao, mi, pocari, warrior, nuoc, sua, do an, do uong => food_drink\n"
        "- cho Han, bao, me, bo, nguoi than, mua do cho => family\n"
        "- chung khoan, co phieu, dau tu, workshop => investment\n"
        "- sach, khoa hoc, hoc phi => learning\n"
        "- tu thien, ung ho, donate => charity\n"
        "Return minified JSON only. No markdown. No comments. No trailing commas.\n"
        "Return JSON only in this exact shape: "
        '{"items":[{"id":"same id","category":"one_allowed_category"}]}\n'
        f"Items:\n{json.dumps({'items': items}, ensure_ascii=False)}"
    )


def _extract_json_object(text: str) -> dict[str, Any]:
    cleaned_text = (text or "").strip()

    if cleaned_text.startswith("```"):
        cleaned_text = re.sub(r"^```(?:json)?\s*", "", cleaned_text)
        cleaned_text = re.sub(r"\s*```$", "", cleaned_text)

    match = re.search(r"\{.*\}", cleaned_text, flags=re.DOTALL)

    if not match:
        raise ValueError("No JSON object found in provider response.")

    return json.loads(match.group(0))


def _normalize_result(items: list[dict[str, Any]], parsed_payload: dict[str, Any]) -> list[dict[str, str]]:
    items_by_id = {
        item.get("id"): item.get("category")
        for item in parsed_payload.get("items", [])
        if item.get("id") and item.get("category") in ALLOWED_CATEGORIES
    }

    return [{"id": item["id"], "category": items_by_id.get(item["id"], "uncategorized")} for item in items]


def _chunk_items(items: list[dict[str, Any]], chunk_size: int = 4) -> list[list[dict[str, Any]]]:
    return [items[index : index + chunk_size] for index in range(0, len(items), chunk_size)]


def _classify_chunk(items: list[dict[str, Any]]) -> dict[str, Any]:
    providers = ["groq", "gemini", "openai", "kimi", "claude", "perplexity"]
    last_error = "Unknown AI classification failure."

    for provider in providers:
        try:
            response = ask_provider_chain(
                _build_prompt(items),
                json_mode=True,
                preferred_providers=[provider],
                max_output_tokens=220,
            )
            parsed_payload = _extract_json_object(response["text"])
            return {
                "items": _normalize_result(items, parsed_payload),
                "provider": response["provider"],
            }
        except Exception as exc:  # noqa: BLE001
            last_error = str(exc)

    raise ValueError(last_error)


def classify_transactions_with_ai(items: list[dict[str, Any]]) -> dict[str, Any]:
    if not items:
        return {"items": []}

    classified_items: list[dict[str, str]] = []
    used_providers: list[str] = []

    for chunk in _chunk_items(items):
        response = _classify_chunk(chunk)
        classified_items.extend(response["items"])
        if response["provider"] not in used_providers:
            used_providers.append(response["provider"])

    return {
        "items": classified_items,
        "provider": ",".join(used_providers),
    }
