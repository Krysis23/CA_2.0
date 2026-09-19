import json
import os
import google.generativeai as genai
from typing import Dict, Any, List

from dev_config import DEV_GEMINI_API_KEY, DEV_MODEL
from search import search_rag

# Initialize the Gemini model using the DEV key
genai.configure(api_key=DEV_GEMINI_API_KEY)
# We use gemini-2.5-flash as requested
model = genai.GenerativeModel(DEV_MODEL)

def _build_rag_context(query: str, extracted_data: dict) -> str:
    """Fetches RAG and GraphRAG context based on the query and extracted data."""
    hint = json.dumps(extracted_data) if extracted_data else ""
    try:
        # Top 5 chunks for broader context
        reranked_df, classification = search_rag(query, top_k=8, top_n=5, doc_retrieval_hint=hint)
        
        context_parts = []
        for _, row in reranked_df.iterrows():
            source = row.get("retrieval_method", "vector")
            text = row.get("text", "")
            context_parts.append(f"[{source.upper()}] {text}")
            
        return "\n\n".join(context_parts)
    except Exception as e:
        print(f"[itr_agent] RAG Search failed: {e}")
        return "No additional context available."

def format_history(history: List[Dict[str, str]]) -> str:
    if not history:
        return "No previous conversation."
    lines = []
    for turn in history:
        lines.append(f"User: {turn.get('user', '')}")
        lines.append(f"Assistant: {turn.get('assistant', '')}")
    return "\n".join(lines)

def analyze_itr_requirements(query: str, extracted_data: dict, history: List[Dict[str, str]], current_stage: str) -> Dict[str, Any]:
    """
    Main logic for the ITR Chatbot.
    Uses RAG to find relevant rules, then prompts the LLM to determine the ITR form,
    generate a checklist, or ask for missing information.
    """
    rag_context = _build_rag_context(query, extracted_data)
    convo_history = format_history(history)
    
    prompt = f"""
You are an expert Indian Chartered Accountant assistant helping a user file their Income Tax Return (ITR).
Your goal is to determine the correct ITR Form (ITR-1, ITR-2, ITR-3, ITR-4), provide a document checklist, and ask for any missing critical information.

Use the provided ICAI and Income Tax Rules context (retrieved via RAG) to guide your recommendations.

--- RETRIEVED CONTEXT ---
{rag_context}
-------------------------

--- CONVERSATION HISTORY ---
{convo_history}
----------------------------

--- EXTRACTED DATA SO FAR ---
{json.dumps(extracted_data, indent=2)}
-----------------------------

--- USER'S LATEST MESSAGE ---
{query}
-----------------------------

Current Stage: {current_stage} (collecting, analyzing, ready)

Instructions:
1. Analyze the user's income sources and situation based on the history, latest message, and extracted data.
2. If you have enough information to confidently determine the ITR form (e.g. you know their income sources, residential status, capital gains presence), set "itr_form" to the form name. Otherwise, set it to null.
3. If information is missing (e.g. "Do you have any capital gains or business income?"), provide a conversational question in "bot_reply" and list the missing topics in "missing_info".
4. To make it easier for the user to reply, provide 2-4 likely answer choices in "mcq_options" (e.g., ["Yes, I have business income", "No, just salary", "I have capital gains"]). If no question is asked, leave "mcq_options" empty.
5. If you have all the information, generate a comprehensive document "checklist", provide a helpful summary in "bot_reply", and set the stage to "ready".
6. ALWAYS output valid JSON.

JSON Schema to follow:
{{
  "bot_reply": "string (your conversational response to the user, formatted in Markdown)",
  "mcq_options": ["string", "string"],
  "itr_form": "string or null (e.g., 'ITR-1', 'ITR-2')",
  "checklist": ["string", "string"],
  "missing_info": ["string", "string"],
  "stage": "string (collecting, analyzing, ready)"
}}
"""

    print(f"[itr_agent] Calling Gemini for chatbot analysis...")
    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"[itr_agent] Gemini LLM failed: {e}")
        return {
            "bot_reply": "I'm sorry, I encountered an error analyzing your request. Could you please provide more details about your income sources?",
            "mcq_options": ["Salary only", "Business income", "Capital gains", "Other"],
            "itr_form": None,
            "checklist": [],
            "missing_info": ["income_sources"],
            "stage": "collecting"
        }

def quick_analyze_documents(extracted_data: dict) -> Dict[str, Any]:
    """
    Logic for the Quick Analyse tool. Single-shot analysis based on uploaded documents.
    """
    # Create a synthetic query representing the extracted data to fetch RAG context
    query = f"Determine ITR form and checklist for taxpayer with following data: {json.dumps(extracted_data)}"
    rag_context = _build_rag_context(query, extracted_data)
    
    prompt = f"""
You are an expert Indian Chartered Accountant assistant. The user has uploaded financial documents.
Based on the extracted data from these documents, determine the correct ITR Form and generate a document checklist for filing.

Use the provided ICAI and Income Tax Rules context (retrieved via RAG) to guide your recommendations.

--- RETRIEVED CONTEXT ---
{rag_context}
-------------------------

--- EXTRACTED DATA ---
{json.dumps(extracted_data, indent=2)}
----------------------

Instructions:
1. Analyze the extracted data to determine the likely ITR form (ITR-1, ITR-2, ITR-3, ITR-4). 
2. If data is insufficient, make the best possible guess and list what's missing.
3. Generate a comprehensive document checklist required to file the return.
4. Provide a brief summary in "analysis_summary".
5. ALWAYS output valid JSON.

JSON Schema to follow:
{{
  "analysis_summary": "string (brief summary of findings and rationale for the ITR form)",
  "itr_form": "string (e.g., 'ITR-1', 'ITR-2', or 'Unknown')",
  "checklist": ["string", "string"],
  "missing_info": ["string", "string"]
}}
"""

    print(f"[itr_agent] Calling Gemini for quick analysis...")
    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"[itr_agent] Gemini LLM failed in quick analyze: {e}")
        return {
            "analysis_summary": "Failed to analyze the documents automatically.",
            "itr_form": "Unknown",
            "checklist": [],
            "missing_info": []
        }
