from __future__ import annotations

import json
from typing import Any
from urllib import error, request

from fastapi import HTTPException

from app.config.settings import get_settings


def _clean_key(value: str | None) -> str | None:
    if not value:
        return None

    return value.strip().strip('"').strip("'")


def _http_json_request(
    url: str,
    payload: dict[str, Any],
    headers: dict[str, str],
    timeout: int = 45,
) -> dict[str, Any]:
    http_request = request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    with request.urlopen(http_request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _read_provider_error(exc: Exception) -> str:
    if isinstance(exc, error.HTTPError):
        try:
            payload = json.loads(exc.read().decode("utf-8"))
            if isinstance(payload, dict):
                if isinstance(payload.get("error"), dict):
                    return str(payload["error"].get("message") or payload["error"].get("code") or exc)
                if payload.get("detail"):
                    return str(payload["detail"])
        except (ValueError, json.JSONDecodeError):
            return str(exc)

    return str(exc)


def _call_gemini(
    user_prompt: str,
    system_prompt: str | None,
    json_mode: bool,
    max_output_tokens: int | None,
    settings,
) -> dict[str, Any]:
    api_key = _clean_key(settings.gemini_key)

    if not api_key:
      raise ValueError("GEMINI_KEY is missing.")

    prompt = "\n\n".join(part for part in [system_prompt, user_prompt] if part)
    response_payload = _http_json_request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent?key={api_key}",
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json" if json_mode else "text/plain",
                **({"maxOutputTokens": max_output_tokens} if max_output_tokens else {}),
            },
        },
        {"Content-Type": "application/json"},
    )
    parts = response_payload["candidates"][0]["content"]["parts"]
    text = "".join(part.get("text", "") for part in parts)
    return {"provider": "gemini", "text": text}


def _call_claude(
    user_prompt: str,
    system_prompt: str | None,
    json_mode: bool,
    max_output_tokens: int | None,
    settings,
) -> dict[str, Any]:
    api_key = _clean_key(settings.claude_key)

    if not api_key:
        raise ValueError("CLAUDE_KEY is missing.")

    payload = {
        "model": settings.claude_model,
        "max_tokens": max_output_tokens or 1200,
        "temperature": 0,
        "messages": [{"role": "user", "content": user_prompt}],
    }

    if system_prompt:
        payload["system"] = system_prompt

    response_payload = _http_json_request(
        "https://api.anthropic.com/v1/messages",
        payload,
        {
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
    )
    text = "".join(block.get("text", "") for block in response_payload.get("content", []))
    return {"provider": "claude", "text": text}


def _call_kimi(
    user_prompt: str,
    system_prompt: str | None,
    json_mode: bool,
    max_output_tokens: int | None,
    settings,
) -> dict[str, Any]:
    api_key = _clean_key(settings.kimi_key)

    if not api_key:
        raise ValueError("KIMI_KEY is missing.")

    messages: list[dict[str, str]] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})

    response_payload = _http_json_request(
        "https://api.moonshot.ai/v1/chat/completions",
        {
            "model": settings.kimi_model,
            "temperature": 0,
            **({"max_tokens": max_output_tokens} if max_output_tokens else {}),
            "messages": messages,
        },
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    text = response_payload["choices"][0]["message"]["content"]
    return {"provider": "kimi", "text": text}


def _call_perplexity(
    user_prompt: str,
    system_prompt: str | None,
    json_mode: bool,
    max_output_tokens: int | None,
    settings,
) -> dict[str, Any]:
    api_key = _clean_key(settings.perplexity_key)

    if not api_key:
        raise ValueError("PERPLEXITY_KEY is missing.")

    messages: list[dict[str, str]] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})

    response_payload = _http_json_request(
        "https://api.perplexity.ai/chat/completions",
        {
            "model": settings.perplexity_model,
            "temperature": 0,
            **({"max_tokens": max_output_tokens} if max_output_tokens else {}),
            "messages": messages,
        },
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    text = response_payload["choices"][0]["message"]["content"]
    return {"provider": "perplexity", "text": text}


def _call_groq(
    user_prompt: str,
    system_prompt: str | None,
    json_mode: bool,
    max_output_tokens: int | None,
    settings,
) -> dict[str, Any]:
    api_key = _clean_key(settings.groq_key)

    if not api_key:
        raise ValueError("GROQ_KEY is missing.")

    messages: list[dict[str, str]] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})

    response_payload = _http_json_request(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            "model": settings.groq_model,
            "temperature": 0,
            **({"max_tokens": max_output_tokens} if max_output_tokens else {}),
            "messages": messages,
        },
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    text = response_payload["choices"][0]["message"]["content"]
    return {"provider": "groq", "text": text}


def _call_openai(
    user_prompt: str,
    system_prompt: str | None,
    json_mode: bool,
    max_output_tokens: int | None,
    settings,
) -> dict[str, Any]:
    api_key = _clean_key(settings.openai_api_key)

    if not api_key:
        raise ValueError("OPENAI_API_KEY is missing.")

    messages: list[dict[str, str]] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})

    payload: dict[str, Any] = {
        "model": settings.openai_model,
        "messages": messages,
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    if max_output_tokens:
        payload["max_tokens"] = max_output_tokens

    response_payload = _http_json_request(
        "https://api.openai.com/v1/chat/completions",
        payload,
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    text = response_payload["choices"][0]["message"]["content"]
    return {"provider": "openai", "text": text}


def ask_provider_chain(
    user_prompt: str,
    system_prompt: str | None = None,
    json_mode: bool = False,
    preferred_providers: list[str] | None = None,
    max_output_tokens: int | None = None,
) -> dict[str, Any]:
    settings = get_settings()
    provider_map = {
        "gemini": _call_gemini,
        "claude": _call_claude,
        "kimi": _call_kimi,
        "perplexity": _call_perplexity,
        "groq": _call_groq,
        "openai": _call_openai,
    }
    provider_chain = (
        [(name, provider_map[name]) for name in preferred_providers if name in provider_map]
        if preferred_providers
        else [
            ("gemini", _call_gemini),
            ("claude", _call_claude),
            ("kimi", _call_kimi),
            ("perplexity", _call_perplexity),
            ("groq", _call_groq),
            ("openai", _call_openai),
        ]
    )
    provider_errors: list[str] = []

    for provider_name, provider_func in provider_chain:
        try:
            return provider_func(user_prompt, system_prompt, json_mode, max_output_tokens, settings)
        except Exception as exc:  # noqa: BLE001
            provider_errors.append(f"{provider_name}: {_read_provider_error(exc)}")

    raise HTTPException(
        status_code=502,
        detail="All AI providers failed. " + " | ".join(provider_errors),
    )
