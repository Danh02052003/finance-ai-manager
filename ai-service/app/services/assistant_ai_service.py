from __future__ import annotations

from typing import Any

from app.services.provider_chain import ask_provider_chain


def build_assistant_reply(payload: dict[str, Any]) -> dict[str, Any]:
    page_title = payload.get("page_title") or "khong ro trang"
    page_path = payload.get("page_path") or "/"
    user_message = payload.get("message") or ""
    app_context = payload.get("app_context") or {}

    system_prompt = (
        "You are the in-app finance assistant for a Vietnamese personal finance website based on the 6 jars model.\n"
        "Answer in Vietnamese.\n"
        "Use the provided app context as the source of truth.\n"
        "Be practical, specific, and concise.\n"
        "If data is missing, say what is missing instead of inventing it.\n"
        "If the user asks about the current account status, summarize from the context.\n"
        "If the user asks how to use the site, explain based on the current page and available flows."
    )
    user_prompt = (
        f"Current page title: {page_title}\n"
        f"Current page path: {page_path}\n"
        f"App context:\n{app_context}\n\n"
        f"User message:\n{user_message}"
    )
    response = ask_provider_chain(user_prompt=user_prompt, system_prompt=system_prompt, json_mode=False)

    return {
        "message": response["text"].strip(),
        "provider": response["provider"],
    }
