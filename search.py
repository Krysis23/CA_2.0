"""
search.py
─────────────────────────────────────────────────────────────────────
RAG retrieval with optional HyDE (toggled via dev_config.py).

ENABLE_HYDE = False  →  no Gemini; keyword classification only; raw query vector.
ENABLE_HYDE = True   →  one DEV Gemini call for HyDE text + classification;
                         blend hypothetical embedding with the question vector.
"""

import joblib
import numpy as np
import requests
import re
import os
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import CrossEncoder

try:
    from graphRag.graph_retriever import IncomeTaxGraph
except Exception as exc:  # pragma: no cover - defensive import for environments without the graph module
    IncomeTaxGraph = None
    print(f"[GraphRAG] Unable to import graph retriever: {exc}")

from dev_config import ENABLE_HYDE
from hyde import hypothetical_document       # always returns dict with classification

# ── Embedding corpora ─────────────────────────────────────────────
try:
    FOUNDATION_DF = joblib.load("embeddings_foundation.joblib")
    INTER_DF      = joblib.load("embeddings_Intermediate.joblib")
    FINAL_DF      = joblib.load("embeddings_Final.joblib")
except FileNotFoundError as e:
    raise RuntimeError(
        f"[search] Embedding file not found: {e}\n"
        "Make sure all three .joblib files are in the working directory."
    ) from e

ALL_DF  = pd.concat([FOUNDATION_DF, INTER_DF, FINAL_DF], ignore_index=True)
VECTORS = np.vstack(ALL_DF["embedding"].values)

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
GRAPH_PATH = os.getenv("INCOME_TAX_GRAPH_PATH", os.path.join("graphRag", "income_tax_graph.gpickle"))
GRAPH_EMBEDDINGS_PATH = os.getenv("INCOME_TAX_EMBEDDINGS_PATH", os.path.join("graphRag", "income_tax_embeddings.joblib"))

GRAPH_RETRIEVER = None
GRAPH_EMBEDDING_IDS = []
GRAPH_EMBEDDING_TEXTS = []
GRAPH_EMBEDDING_PAGES = []
GRAPH_EMBEDDING_CHUNKS = []
GRAPH_EMBEDDING_VECTORS = None


def _load_graph_components():
    global GRAPH_RETRIEVER, GRAPH_EMBEDDING_IDS, GRAPH_EMBEDDING_TEXTS, GRAPH_EMBEDDING_PAGES
    global GRAPH_EMBEDDING_CHUNKS, GRAPH_EMBEDDING_VECTORS

    if IncomeTaxGraph is None:
        return

    try:
        if os.path.exists(GRAPH_PATH):
            GRAPH_RETRIEVER = IncomeTaxGraph(GRAPH_PATH)
            print(f"[GraphRAG] Loaded graph from {GRAPH_PATH}")
        else:
            print(f"[GraphRAG] Graph file not found: {GRAPH_PATH}")
    except Exception as exc:
        print(f"[GraphRAG] Failed to load graph: {exc}")
        GRAPH_RETRIEVER = None

    try:
        if os.path.exists(GRAPH_EMBEDDINGS_PATH):
            graph_data = joblib.load(GRAPH_EMBEDDINGS_PATH)
            GRAPH_EMBEDDING_IDS = list(graph_data.get("ids", []))
            GRAPH_EMBEDDING_TEXTS = list(graph_data.get("texts", []))
            GRAPH_EMBEDDING_PAGES = list(graph_data.get("pages", []))
            GRAPH_EMBEDDING_CHUNKS = list(graph_data.get("chunks", []))
            GRAPH_EMBEDDING_VECTORS = np.asarray(graph_data.get("embeddings", []), dtype=np.float32)
            print(f"[GraphRAG] Loaded {len(GRAPH_EMBEDDING_TEXTS)} graph embeddings from {GRAPH_EMBEDDINGS_PATH}")
        else:
            print(f"[GraphRAG] Graph embeddings file not found: {GRAPH_EMBEDDINGS_PATH}")
    except Exception as exc:
        print(f"[GraphRAG] Failed to load graph embeddings: {exc}")
        GRAPH_EMBEDDING_IDS = []
        GRAPH_EMBEDDING_TEXTS = []
        GRAPH_EMBEDDING_PAGES = []
        GRAPH_EMBEDDING_CHUNKS = []
        GRAPH_EMBEDDING_VECTORS = None


_load_graph_components()


def clean_text(text):
    """
    Sanitize text before sending to Ollama embedding.
    Removes NaN/None literals and collapses whitespace.
    Preserves Unicode (including ₹) — bge-m3 handles it fine.
    """
    if not text:
        return ""
    text = str(text)
    text = text.replace("NaN", "").replace("nan", "").replace("None", "").replace("null", "")
    text = re.sub(r"\s+", " ", text).strip()
    return text[:2000]


def embed(text):
    """Embed text using Ollama bge-m3. Always cleans input first."""
    text = clean_text(text)

    if not text:
        raise Exception("embed() received empty text after cleaning")

    try:
        r = requests.post(
            f"{OLLAMA_URL}/api/embeddings",
            json={"model": "bge-m3", "prompt": text},
            timeout=30,
        )
        r.raise_for_status()
    except requests.exceptions.ConnectionError:
        raise Exception(
            "Embedding service (Ollama) is not running. "
            "Start it with: ollama serve"
        )
    except requests.exceptions.Timeout:
        raise Exception("Ollama embedding timed out. The model may still be loading.")
    except requests.exceptions.HTTPError as e:
        raise Exception(f"Ollama returned an HTTP error: {e}")

    data = r.json()
    if "embedding" not in data:
        raise Exception(f"Embedding failed: {data}")

    return data["embedding"]


def rerank(query, chunks_df, top_n=4):
    pairs  = [[query, text] for text in chunks_df["text"].values]
    scores = reranker.predict(pairs)

    chunks_df = chunks_df.copy()
    chunks_df["rerank_score"] = scores

    return chunks_df.sort_values("rerank_score", ascending=False).head(top_n)


def _stable_chunk_key(row):
    if isinstance(row, pd.Series):
        row_dict = row.to_dict()
    else:
        row_dict = dict(row)

    for key in ("id", "chunk_id", "chunk", "page"):
        value = row_dict.get(key)
        if value not in (None, "", np.nan):
            if key == "page" and row_dict.get("chunk") not in (None, "", np.nan):
                return f"{value}:{row_dict['chunk']}"
            return str(value)

    text = row_dict.get("text")
    if text not in (None, "", np.nan):
        return f"text:{str(text)}"

    return ""


def _prepare_candidate_frame(candidates_df, retrieval_method="vector", default_level="final", default_book=""):
    if candidates_df is None or candidates_df.empty:
        return pd.DataFrame(columns=["text", "similarity", "level", "book", "chunk_id", "retrieval_method", "graph_query"])

    prepared = candidates_df.copy()
    prepared["retrieval_method"] = retrieval_method
    if "similarity" not in prepared.columns:
        prepared["similarity"] = np.nan
    if "level" not in prepared.columns:
        prepared["level"] = default_level
    prepared["level"] = prepared["level"].fillna(default_level)
    prepared["level"] = prepared["level"].astype(str).replace({"nan": default_level, "None": default_level})
    prepared["level"] = prepared["level"].replace({"": default_level})
    if "book" not in prepared.columns:
        prepared["book"] = default_book
    prepared["book"] = prepared["book"].fillna(default_book)
    prepared["book"] = prepared["book"].astype(str).replace({"nan": default_book, "None": default_book})
    prepared["book"] = prepared["book"].replace({"": default_book})
    if "paper" not in prepared.columns:
        prepared["paper"] = ""
    if "chunk_id" not in prepared.columns:
        prepared["chunk_id"] = prepared.get("id", prepared.get("chunk", ""))
    prepared["chunk_id"] = prepared["chunk_id"].fillna("")
    if "graph_query" not in prepared.columns:
        prepared["graph_query"] = None
    return prepared


def _merge_candidates(vector_candidates, graph_candidates):
    merged = {}

    for _, row in vector_candidates.iterrows():
        key = _stable_chunk_key(row)
        if key not in merged:
            merged[key] = dict(row)
        else:
            existing = merged[key]
            existing["retrieval_method"] = "vector+graph"
            if existing.get("similarity") is None or np.isnan(existing.get("similarity")):
                existing["similarity"] = row.get("similarity")
            else:
                existing["similarity"] = max(float(existing.get("similarity", 0) or 0), float(row.get("similarity", 0) or 0))

    for _, row in graph_candidates.iterrows():
        key = _stable_chunk_key(row)
        if key not in merged:
            merged[key] = dict(row)
            continue

        existing = merged[key]
        existing["retrieval_method"] = "vector+graph"
        if row.get("graph_query") and not existing.get("graph_query"):
            existing["graph_query"] = row.get("graph_query")
        existing["similarity"] = max(float(existing.get("similarity", 0) or 0), float(row.get("similarity", 0) or 0))

    merged_df = pd.DataFrame(list(merged.values()))
    if merged_df.empty:
        return merged_df

    if "level" not in merged_df.columns:
        merged_df["level"] = "final"
    merged_df["level"] = merged_df["level"].fillna("final")
    merged_df["level"] = merged_df["level"].astype(str).replace({"nan": "final", "None": "final"})
    merged_df["level"] = merged_df["level"].replace({"": "final"})
    if "book" not in merged_df.columns:
        merged_df["book"] = ""
    if "paper" not in merged_df.columns:
        merged_df["paper"] = ""
    if "chunk_id" not in merged_df.columns:
        merged_df["chunk_id"] = merged_df.get("id", merged_df.get("chunk", ""))
    merged_df["chunk_id"] = merged_df["chunk_id"].fillna("")
    if "graph_query" not in merged_df.columns:
        merged_df["graph_query"] = None
    if "retrieval_method" not in merged_df.columns:
        merged_df["retrieval_method"] = "vector"

    return merged_df


def search_graph_embeddings(query, top_k=3):
    if not GRAPH_EMBEDDING_TEXTS or GRAPH_EMBEDDING_VECTORS is None:
        return []

    try:
        query_embedding = np.array(embed(clean_text(query)))
    except Exception as exc:
        print(f"[GraphRAG] Embedding failed for graph query: {exc}")
        return []

    if query_embedding.shape[0] != GRAPH_EMBEDDING_VECTORS.shape[1]:
        print(f"[GraphRAG] Embedding dimension mismatch: {query_embedding.shape[0]} vs {GRAPH_EMBEDDING_VECTORS.shape[1]}")
        return []

    query_norm = np.linalg.norm(query_embedding)
    if query_norm == 0:
        return []
    query_embedding = query_embedding / query_norm

    stored_norms = np.linalg.norm(GRAPH_EMBEDDING_VECTORS, axis=1, keepdims=True)
    normalized_embeddings = GRAPH_EMBEDDING_VECTORS / np.maximum(stored_norms, 1e-12)
    scores = (normalized_embeddings @ query_embedding).flatten()
    top_idx = np.argsort(scores)[::-1][:top_k]

    results = []
    for idx in top_idx:
        item_idx = int(idx)
        results.append({
            "id": GRAPH_EMBEDDING_IDS[item_idx],
            "chunk_id": GRAPH_EMBEDDING_IDS[item_idx],
            "text": GRAPH_EMBEDDING_TEXTS[item_idx],
            "page": GRAPH_EMBEDDING_PAGES[item_idx],
            "chunk": GRAPH_EMBEDDING_CHUNKS[item_idx],
            "level": "income_tax_graph",
            "book": "income_tax",
            "score": float(scores[item_idx]),
            "retrieval_method": "graph",
        })

    return results


def _graph_retrieval_candidates(question, top_k_per_query=3, max_graph_queries=5):
    if GRAPH_RETRIEVER is None or GRAPH_EMBEDDING_VECTORS is None:
        return pd.DataFrame(columns=["text", "similarity", "level", "book", "chunk_id", "retrieval_method", "graph_query"]), []

    try:
        matched_entities = GRAPH_RETRIEVER.find_entity(question, max_results=max_graph_queries)
        print(f"\n[GraphRAG] Matched entities:")
        if not matched_entities:
            print("- none")
        for entity in matched_entities:
            print(f"- {entity.get('name')} ({entity.get('type')})")

        if not matched_entities:
            return pd.DataFrame(columns=["text", "similarity", "level", "book", "chunk_id", "retrieval_method", "graph_query"]), []

        expanded_queries = []
        for entity in matched_entities:
            entity_name = entity.get("name")
            if entity_name:
                expanded_queries.append(str(entity_name).strip())
            related_entities = GRAPH_RETRIEVER.get_related_entities(entity.get("node"), max_results=20)
            for related in related_entities:
                rel_name = related.get("name")
                if rel_name and str(rel_name).strip() not in expanded_queries:
                    expanded_queries.append(str(rel_name).strip())

        expanded_queries = [q for q in expanded_queries if q][:max_graph_queries]
        print("[GraphRAG] Expanded queries:")
        for query in expanded_queries:
            print(f"- {query}")

        graph_rows = []
        for query in expanded_queries:
            query_results = search_graph_embeddings(query, top_k=top_k_per_query)
            for result in query_results:
                result["graph_query"] = query
                result["similarity"] = result.get("score")
                graph_rows.append(result)

        if not graph_rows:
            print("[GraphRAG] Candidates: 0")
            return pd.DataFrame(columns=["text", "similarity", "level", "book", "chunk_id", "retrieval_method", "graph_query"]), []

        graph_df = pd.DataFrame(graph_rows)
        graph_df = _prepare_candidate_frame(graph_df, retrieval_method="graph", default_level="income_tax_graph", default_book="income_tax")
        graph_df["level"] = graph_df["level"].fillna("final")
        graph_df["level"] = graph_df["level"].replace({"": "final"})
        graph_df["chunk_id"] = graph_df["chunk_id"].fillna(graph_df["id"]).fillna("")
        graph_df["similarity"] = graph_df["similarity"].astype(float)
        print(f"[GraphRAG] Candidates: {len(graph_df)}")
        return graph_df, expanded_queries
    except Exception as exc:
        print(f"[GraphRAG] Failed: {exc}")
        return pd.DataFrame(columns=["text", "similarity", "level", "book", "chunk_id", "retrieval_method", "graph_query"]), []


def is_numeric_query(q):
    """Used only when HyDE is on — determines blend weights."""
    return any(k in q.lower() for k in [
        "tax", "80c", "80d", "income", "salary",
        "gst", "compute", "calculate",
    ])


def search_rag(question, top_k=8, top_n=4, doc_retrieval_hint: str | None = None):
    """
    question — primary search text (the clean user question).
               Never pass the full combined query with memory/OCR here;
               that string is for process_query() only.

    doc_retrieval_hint — optional short factual line (e.g. from uploaded bank
    / tax JSON). When set, it is appended for the primary embedding and passed
    into HyDE (when enabled) so the hypothetical paragraph stays consistent
    with upload-derived numbers.

    HyDE / classification:
      hypothetical_document() always returns a dict with `classification`.
      Blend weights use classification.needs_calculation when present.

    Returns:
        (reranked_chunks_df, classification_dict)
    """
    print("\n[RAG] Starting retrieval...")

    embed_question = question.strip()
    if doc_retrieval_hint and str(doc_retrieval_hint).strip():
        hint = clean_text(str(doc_retrieval_hint).strip())
        if hint:
            embed_question = clean_text(f"{embed_question}\n{hint}")[:2000]

    # ── Step 1: Embed question (+ optional upload hint) ───────────
    raw_vec = np.array(embed(embed_question))

    # ── Step 2: HyDE blend (hypothetical text only when HyDE on and Gemini succeeds) ─
    hyde_response = hypothetical_document(question.strip(), context_hint=doc_retrieval_hint)
    hyde_text = hyde_response.get("hypothetical_document")
    classification = hyde_response.get("classification") or {}

    is_numeric = (
        classification.get("needs_calculation", False)
        if classification
        else is_numeric_query(question.strip())
    )

    if hyde_text:
        hyde_vec = np.array(embed(hyde_text))

        if is_numeric:
            print("[HyDE] Numeric / calc intent → RAW priority (0.8 / 0.2)")
            q_vec = (0.8 * raw_vec) + (0.2 * hyde_vec)
        else:
            print("[HyDE] Theory intent → HyDE priority (0.4 / 0.6)")
            q_vec = (0.4 * raw_vec) + (0.6 * hyde_vec)
    else:
        if ENABLE_HYDE:
            print("[HyDE] No hypothetical text — raw vector only")
        q_vec = raw_vec

    # ── Step 3: Cosine similarity over full corpus ────────────────
    sims    = cosine_similarity(VECTORS, [q_vec]).flatten()
    top_idx = sims.argsort()[::-1][:top_k]

    candidates               = ALL_DF.iloc[top_idx].copy()
    candidates["similarity"] = sims[top_idx]
    candidates = _prepare_candidate_frame(candidates, retrieval_method="vector", default_level="final", default_book="")

    print(f"\n[Retrieval] Top {top_k}:")
    print(candidates[["level", "book", "chunk_id", "similarity"]])

    # ── Step 4: GraphRAG expansion (additional retrieval source) ───
    graph_candidates, expanded_queries = _graph_retrieval_candidates(question.strip(), top_k_per_query=3, max_graph_queries=5)
    combined_candidates = _merge_candidates(candidates, graph_candidates)

    print(f"\n[Hybrid] Unique candidates after merge: {len(combined_candidates)}")

    # ── Step 5: Rerank all candidates together ───────────────────
    reranked = rerank(question.strip(), combined_candidates, top_n=top_n)

    print(f"\n[Reranker] Top {top_n}:")
    print(reranked[["level", "book", "chunk_id", "retrieval_method", "rerank_score"]])

    return reranked, classification