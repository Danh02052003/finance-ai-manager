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
    "personal_care",
    "shopping",
    "transport",
    "health",
    "entertainment",
    "uncategorized",
}


def _build_prompt(items: list[dict[str, Any]]) -> str:
    return (
        "You classify Vietnamese personal finance transactions for a 6-jar budgeting app.\n"
        "Each item is already one transaction.\n"
        "Allowed categories only: food_drink, bills, investment, learning, family, charity, personal_care, shopping, transport, health, entertainment, uncategorized.\n"
        "Use description as the main signal. Try your best to logically deduce the category. Only use uncategorized for pure gibberish or completely unrelated text.\n"
        "Important hints for Vietnamese shorthand and mapping:\n"
        "- 4g, 5g, nap dt, nap dien thoai, netflix, internet, wifi, dien, nuoc, tien nha => bills\n"
        "- cf, cafe, ca phe, tra sua, bun, chao, mi, pocari, warrior, nuoc, sua, do an, do uong, thit, ca, rau => food_drink\n"
        "- cho Han, bao, me, bo, nguoi than, mua do cho, may loc, do gia dung, noi that, tivi, tu lanh, may giat, cho nha => family\n"
        "- chung khoan, co phieu, dau tu, workshop => investment\n"
        "- sach, khoa hoc, hoc phi => learning\n"
        "- tu thien, ung ho, donate => charity\n"
        "- sua tam, my pham, cat toc, lam dep, cham soc, skincare, makeup => personal_care\n"
        "- quan ao, giay dep, shopee, lazada, tiktok shop, tiki, mua sam => shopping\n"
        "- do xang, grab, be, xanh sm, ve xe, bao duong xe, thay nhot => transport\n"
        "- kham benh, mua thuoc, vien phi, bao hiem, kham nha khoa => health\n"
        "- xem phim, netflix, du lich, game, giai tri, di choi, dao pho => entertainment\n"
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


def _build_story_prompt(story: str, context_date: str) -> str:
    return (
        "You are an AI that extracts Vietnamese personal finance transactions from a natural language story.\n"
        "The context date is: " + context_date + ".\n"
        "If a transaction's date is not mentioned, assume the context date.\n"
        "If 'hôm qua' (yesterday) is mentioned, context date - 1 day.\n"
        "If 'hôm bữa' is mentioned, context date - 2 days.\n"
        "If 'ngày mốt' is mentioned, context date + 2 days.\n"
        "If the story contains dates in DD/MM or DD/MM/YYYY format, parse them but ALWAYS output the final JSON date in YYYY-MM-DD.\n"
        "Allowed categories: food_drink, bills, investment, learning, family, charity, personal_care, shopping, transport, health, entertainment, uncategorized.\n"
        "Allowed jars: essentials, education, enjoyment, financial_freedom, charity.\n"
        "Jar mapping rules (CRITICAL):\n"
        "- essentials: daily eating, parking, buying water/drinks.\n"
        "- enjoyment: having fun, hanging out, snacks, entertainment.\n"
        "- education: learning new things, courses, books.\n"
        "- financial_freedom: investing in something.\n"
        "- charity: giving money to family, relatives, or someone else.\n"
        "NEVER use long_term_saving or any saving jar. It is strictly forbidden for daily expenses.\n"
        "Allowed directions: expense, income_adjustment.\n"
        "Map Vietnamese shorthands:\n"
        "- 'k' means thousand (e.g. 50k = 50000).\n"
        "- 'cá' means thousand (e.g. 1 cá = 1000).\n"
        "- 'lít' means 100 thousand (e.g. 1 lít = 100000).\n"
        "- 'củ' means million (e.g. 1 củ = 1000000).\n"
        "- 'tỏi' means billion (e.g. 1 tỏi = 1000000000).\n"
        "- 'jack' means 5 million (e.g. 1 jack = 5000000).\n"
        "- 'Alex' means 50 dollars which equals 1250000 (e.g. 1 Alex = 1250000).\n"
        "Return minified JSON only. No markdown. No comments.\n"
        "Return JSON only in this exact shape: "
        '{"transactions":[{"date":"YYYY-MM-DD","amount":50000,"jar_key":"essentials","direction":"expense","description":"string","category":"food_drink"}]}\n'
        f"Story:\n{story}"
    )


def extract_transactions_from_story(story: str, context_date: str | None = None) -> dict[str, Any]:
    from datetime import datetime
    if not context_date:
        context_date = datetime.now().strftime("%Y-%m-%d")

    if not story or not story.strip():
        return {"transactions": []}

    try:
        response = ask_provider_chain(
            _build_story_prompt(story, context_date),
            json_mode=True,
            preferred_providers=["gemini", "openai", "groq", "claude", "perplexity"],
            max_output_tokens=1000,
        )
        parsed_payload = _extract_json_object(response["text"])
        return {
            "transactions": parsed_payload.get("transactions", []),
            "provider": response["provider"],
        }
    except Exception as exc:
        raise ValueError(f"AI extraction failed: {str(exc)}")

