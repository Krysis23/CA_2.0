import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from search import search_rag

QUERIES = [
    "What is Section 87A?",
    "What provisions were amended by Finance Act 2026?",
    "What is the deduction under Section 80C?",
    "Who is eligible for Section 80CCD?",
    "What is the new tax regime?",
]

for query in QUERIES:
    print(f"\nQUERY: {query}")
    try:
        chunks, classification = search_rag(query, top_k=8, top_n=4)
        print("VECTOR RESULTS")
        print(chunks[["text", "similarity", "rerank_score", "retrieval_method"]].head(4).to_string(index=False))
        print("GRAPH MATCHED ENTITIES")
        print("(logged by search.py)")
        print("GRAPH EXPANDED QUERIES")
        print("(logged by search.py)")
        print("GRAPH RESULTS")
        print("(logged by search.py)")
        print("MERGED UNIQUE CANDIDATES")
        print(f"{len(chunks)} final candidates")
        print("FINAL RERANKED RESULTS")
        print(chunks[["text", "retrieval_method", "rerank_score"]].head(4).to_string(index=False))
    except Exception as exc:
        print(f"ERROR: {exc}")
