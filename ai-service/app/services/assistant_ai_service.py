from __future__ import annotations

import json
from typing import Any

from app.services.provider_chain import ask_provider_chain


def _extract_json_object(value: str) -> dict[str, Any]:
    raw_value = (value or "").strip()

    if not raw_value:
        return {}

    try:
        parsed_value = json.loads(raw_value)
        return parsed_value if isinstance(parsed_value, dict) else {}
    except json.JSONDecodeError:
        start = raw_value.find("{")
        end = raw_value.rfind("}")

        if start == -1 or end == -1 or end <= start:
            return {}

        try:
            parsed_value = json.loads(raw_value[start : end + 1])
            return parsed_value if isinstance(parsed_value, dict) else {}
        except json.JSONDecodeError:
            return {}


def build_assistant_reply(payload: dict[str, Any]) -> dict[str, Any]:
    page_title = payload.get("page_title") or "khong ro trang"
    page_path = payload.get("page_path") or "/"
    user_message = payload.get("message") or ""
    app_context = payload.get("app_context") or {}

    system_prompt = (
        "You are the in-app finance assistant for a Vietnamese personal finance website based on the 6 jars model.\n"
        "Answer in Vietnamese.\n"
        "Use the provided app context as the source of truth.\n"
        "The app context may include a detailed usage guide in markdown; treat it as authoritative product documentation.\n"
        "Be practical, specific, and concise.\n"
        "If data is missing, say what is missing instead of inventing it.\n"
        "If the user asks about the current account status, summarize from the context.\n"
        "If the user asks how to use the site, explain based on the current page, available flows, and the detailed documentation.\n"
        "Distinguish clearly between monthly planned budget and actual balance snapshots kept separately from previous months.\n"
        "If the context includes MoMo yield data, explain clearly gross yield, 5% withholding tax, and net yield.\n"
        "Return valid JSON only with this exact shape: "
        '{"message":"string","navigation":{"path":"string","target_id":"string","query":{"key":"value"}}}.\n'
        'If no navigation is needed, set "navigation" to null.\n'
        "Use only paths and target_ids that exist in the provided app context page_targets.\n"
        "Use query only when it helps open the right state, for example quickAdd=1 on the transactions editor.\n"
        "When the user is asking where to go, how to do something, or which page/section to use, include a navigation object."
    )
    user_prompt = (
        f"Current page title: {page_title}\n"
        f"Current page path: {page_path}\n"
        f"App context:\n{app_context}\n\n"
        f"User message:\n{user_message}"
    )
    response = ask_provider_chain(
        user_prompt=user_prompt,
        system_prompt=system_prompt,
        json_mode=True,
        preferred_providers=["gemini", "openai", "groq", "kimi", "claude", "perplexity"],
        max_output_tokens=500,
    )
    parsed_payload = _extract_json_object(response["text"])
    message = str(parsed_payload.get("message") or "").strip() or response["text"].strip()
    navigation = parsed_payload.get("navigation")

    if not isinstance(navigation, dict):
        navigation = None

    return {
        "message": message,
        "provider": response["provider"],
        "navigation": navigation,
    }
