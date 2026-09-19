import base64
import google.generativeai as genai
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
vision_model = genai.GenerativeModel("gemini-2.5-flash")


def read_as_base64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def get_mime_type(path):
    ext = path.split(".")[-1].lower()
    return {
        "pdf":  "application/pdf",
        "png":  "image/png",
        "jpg":  "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
    }.get(ext, "image/jpeg")


def strip_trailing_commas(text: str) -> str:
    """Remove trailing commas before closing braces/brackets that make JSON invalid.
    Handles commas that appear just before } or ] (ignoring whitespace/newlines)."""
    # Strip trailing commas before } or ]
    return re.sub(r",\s*([}\]])", r"\1", text)


def extract_json_object(text: str) -> str:
    """Extract the first complete JSON object from text, correctly skipping braces
    that appear inside string values (handles escape sequences too)."""
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in response")

    depth = 0
    in_string = False
    i = start
    while i < len(text):
        ch = text[i]
        if in_string:
            if ch == "\\":       # escape sequence — skip next char
                i += 2
                continue
            elif ch == '"':
                in_string = False
        else:
            if ch == '"':
                in_string = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start:i + 1]
        i += 1

    # Response was cut off — try to salvage by auto-closing open structures
    partial = text[start:]
    return _repair_truncated_json(partial)


def _repair_truncated_json(text: str) -> str:
    """Best-effort repair of a truncated JSON string by closing open brackets/braces."""
    stack = []
    in_string = False
    i = 0
    while i < len(text):
        ch = text[i]
        if in_string:
            if ch == "\\":
                i += 2
                continue
            elif ch == '"':
                in_string = False
        else:
            if ch == '"':
                in_string = True
            elif ch in ("{", "["):
                stack.append(ch)
            elif ch == "}":
                if stack and stack[-1] == "{":
                    stack.pop()
            elif ch == "]":
                if stack and stack[-1] == "[":
                    stack.pop()
        i += 1

    # If we're mid-string, close it
    if in_string:
        text += '"'

    # Close any open containers in reverse order
    for opener in reversed(stack):
        text += "}" if opener == "{" else "]"

    return text


def extract_bank_summary_with_gemini(path, context=None):
    """
    Use Gemini Vision to analyze bank statement and return structured financial JSON.
    
    Gemini Vision calculates:
    - Bank balances and transactions
    - Estimated annual income
    - FY 2025-26 New Regime tax with all slabs
    - Standard deduction and Section 87A rebate
    - Health & Education Cess
    
    Returns:
        dict — Complete structured JSON with all financial and tax data
    """
    data = read_as_base64(path)
    mime = get_mime_type(path)

    if context == "itr":
        prompt = """You are a Chartered Accountant and tax expert.

Analyze this document CAREFULLY and return ONLY valid JSON.

NO markdown, NO code fences, NO explanations, and NO tables.

ONLY strict valid JSON parsable by json.loads().

OUTPUT JSON SCHEMA (all fields required, use 0 for missing):

{
  "person_entity": "extracted name or N/A",
  "statement_period": "date range or N/A",

  "opening_balance": 0,
  "total_credits": 0,
  "total_debits": 0,
  "closing_balance": 0,

  "estimated_annual_income": 0,
  "summary_text": "one-line summary of key financials"
}
"""
    else:
        prompt = """You are a Chartered Accountant and tax expert.

Analyze this bank statement image/document CAREFULLY and return ONLY valid JSON.

NO markdown, NO code fences, NO explanations, and NO tables.

ONLY strict valid JSON parsable by json.loads().

OUTPUT JSON SCHEMA (all fields required, use 0 for missing):

{
  "person_entity": "extracted name or N/A",
  "statement_period": "date range or N/A",

  "opening_balance": 0,
  "total_credits": 0,
  "total_debits": 0,
  "closing_balance": 0,

  "estimated_annual_income": 0,
  "taxable_income_estimate": 0,
  "estimated_tax_new_regime_fy_2025_26": 0,

  "transactions": [
    {
      "date": "DD Mon YYYY",
      "description": "short description",
      "amount": "0.00",
      "type": "credit or debit"
    }
  ], // CRITICAL: Extract a MAXIMUM of 50 transactions (the 50 most recent/important). Do NOT extract more or the response will be truncated.

  "tax_breakdown": {
    "gross_income": 0,
    "standard_deduction": 75000,
    "taxable_income": 0,
    "slab_breakdown": [
      {"range": "0-4L", "rate": "0%", "tax": 0},
      {"range": "4L-8L", "rate": "5%", "tax": 0},
      {"range": "8L-12L", "rate": "10%", "tax": 0},
      {"range": "12L-16L", "rate": "15%", "tax": 0},
      {"range": "16L-20L", "rate": "20%", "tax": 0},
      {"range": "20L-24L", "rate": "25%", "tax": 0},
      {"range": "24L+", "rate": "30%", "tax": 0}
    ],
    "rebate_87a": 0,
    "base_tax": 0,
    "cess_4_percent": 0,
    "final_tax": 0
  },

  "summary_text": "one-line summary of key financials",

  "chat_context": {
    "document_type": "bank_statement",
    "income": {
      "salary": 0,
      "business_income": 0,
      "other_income": 0
    },
    "bank_summary": {
      "opening_balance": 0,
      "credits": 0,
      "debits": 0,
      "closing_balance": 0
    },
    "tax_context": {
      "regime": "new",
      "fy": "2025-26",
      "estimated_tax": 0,
      "taxable_income": 0,
      "standard_deduction": 75000,
      "rebate_87a": 0,
      "slab_breakdown": []
    }
  }
}

CALCULATION RULES (FY 2025-26 NEW REGIME):

Step 1: Extract from Statement
- person_entity: Name on account
- statement_period: Date range
- opening_balance: Starting balance
- total_credits: Sum of all deposits/credits
- total_debits: Sum of all withdrawals/debits
- closing_balance: Ending balance

Step 2: Estimate Annual Income
- estimated_annual_income = total_credits (assume monthly statement, annualize as needed)
- gross_income = estimated_annual_income

Step 3: Apply Standard Deduction
- standard_deduction = 75000 (fixed)
- taxable_income = gross_income - standard_deduction (minimum 0)

Step 4: Calculate Tax Using Slabs (on taxable_income)
- 0 to 4,00,000: 0%
- 4,00,001 to 8,00,000: 5%
- 8,00,001 to 12,00,000: 10%
- 12,00,001 to 16,00,000: 15%
- 16,00,001 to 20,00,000: 20%
- 20,00,001 to 24,00,000: 25%
- Above 24,00,000: 30%

Step 5: Section 87A rebate (FY 2025-26 NEW REGIME) — then base tax before cess
Let `tax` = slab tax on taxable_income from Step 4 only (no cess yet).

- If taxable_income <= 12,00,000:
    rebate_87a = FULL slab tax `tax` (the entire pre-rebate liability).
    base_tax = max(0, tax - rebate_87a)  → must be 0, so final tax after cess is ₹0.
- Else if taxable_income > 12,00,000 AND taxable_income <= 12,75,000 (marginal relief band):
    Tax after rebate must not exceed income over ₹12L: cap post-rebate tax at (taxable_income - 1200000).
    base_tax = min(tax, taxable_income - 1200000)
    rebate_87a = max(0, tax - base_tax)
- Else (taxable_income > 12,75,000):
    rebate_87a = 0
    base_tax = tax

Never use rebate_87a = min(tax, 12500) — that is obsolete for FY 2025-26 new regime.

Step 6: Health & Education Cess
- cess_4_percent = base_tax × 0.04 (cess is computed on post–87A base_tax only, not on any surcharge).
- If you model surcharge separately for very high incomes, total payable = base_tax + surcharge + cess_4_percent; otherwise final_tax = base_tax + cess_4_percent.

Populate tax_breakdown.rebate_87a, tax_breakdown.base_tax, tax_breakdown.cess_4_percent, tax_breakdown.final_tax to match this sequence. estimated_tax_new_regime_fy_2025_26 must equal the final total tax payable (including cess, and surcharge if any).

Step 7: Populate slab_breakdown with exact slab amounts and the tax_breakdown fields above

CRITICAL RULES:
- Calculate everything yourself. Python won't recalculate.
- If statement is missing month name or year, return what you can extract (0 if unknown).
- Always populate all array elements in slab_breakdown (even if 0).
- Never return null. Use 0 for unknown values.
- Return complete JSON only. No markdown. No code fences. No explanations.
- Ensure JSON is valid and parsable by json.loads().
"""

    print("[GEMINI CALL] file_handler.extract_bank_summary_with_gemini()")
    response = vision_model.generate_content([
        {"mime_type": mime, "data": data},
        prompt
    ])

    raw_text = response.text.strip()

    # Remove markdown code fences if present
    raw_text = re.sub(r"```json\n?|```\n?", "", raw_text, flags=re.IGNORECASE).strip()

    # --- Layer 1: try direct parse (clean responses won't need extraction) ---
    try:
        parsed = json.loads(raw_text)
        print("[GEMINI PARSE] Direct json.loads succeeded.")
        return parsed
    except json.JSONDecodeError:
        pass

    # --- Layer 1.5: strip trailing commas and retry ---
    cleaned = strip_trailing_commas(raw_text)
    if cleaned != raw_text:
        try:
            parsed = json.loads(cleaned)
            print("[GEMINI PARSE] Succeeded after stripping trailing commas (Layer 1.5).")
            return parsed
        except json.JSONDecodeError:
            pass

    # --- Layer 2: brace-aware extractor + auto-repair for truncated responses ---
    print("[GEMINI PARSE] Direct parse failed; attempting brace-aware extraction.")
    json_text = extract_json_object(raw_text)

    # --- Layer 2.5: strip trailing commas from extracted text ---
    json_text_clean = strip_trailing_commas(json_text)
    try:
        parsed = json.loads(json_text_clean)
        print("[GEMINI PARSE] Brace-aware extraction + trailing-comma strip succeeded.")
        return parsed
    except json.JSONDecodeError:
        pass

    # --- Layer 3: final attempt on raw extracted text (original, pre-strip) ---
    try:
        parsed = json.loads(json_text)
        print("[GEMINI PARSE] Brace-aware extraction succeeded (raw).")
        return parsed
    except json.JSONDecodeError as e:
        # Log the problematic text for debugging
        print(f"[GEMINI PARSE] JSON decode error after extraction: {e}")
        print(f"[GEMINI PARSE] Extracted snippet (first 500 chars): {json_text_clean[:500]}")
        raise ValueError(f"Could not parse Gemini response as JSON: {e}") from e