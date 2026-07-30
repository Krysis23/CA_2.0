import google.generativeai as genai

SUMMARY_PROMPT = """
You are a CA assistant memory compressor.

Given the following conversation turns, extract and summarise ONLY
the financially relevant facts in bullet points.

Focus on:

- Uploaded document details (person, income, TDS, period)
- Tax figures mentioned (deductions, liabilities, advance tax)
- Decisions or conclusions reached
- Pending questions
- Missing documents

Keep the summary under 200 words.

Return plain text bullet points only.

Conversation:

{conversation}
"""


def summarise_turns(
    turns: list[dict],
    model_name: str = "gemini-1.5-flash"
) -> str:
    """
    Compress older turns into a financial summary.
    """

    if not turns:
        return ""

    model = genai.GenerativeModel(model_name)

    formatted = "\n".join(
        f"{t['role'].upper()}: {t['content']}"
        for t in turns
    )

    try:
        response = model.generate_content(
            SUMMARY_PROMPT.format(
                conversation=formatted
            )
        )

        return response.text.strip()

    except Exception as e:

        print(f"[memory] summarisation failed: {e}")

        return ""


def build_context(
    history: list[dict],
    keep_recent: int = 6
) -> dict:
    """
    Split history into

    summary:
        compressed older conversation

    recent:
        latest conversation kept verbatim
    """

    if len(history) <= keep_recent:

        return {
            "summary": "",
            "recent": history
        }

    old_turns = history[:-keep_recent]

    recent_turns = history[-keep_recent:]

    summary = summarise_turns(old_turns)

    return {
        "summary": summary,
        "recent": recent_turns
    }