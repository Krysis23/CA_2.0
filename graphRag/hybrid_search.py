from income_tax_vector import (
    IncomeTaxVectorSearch
)

from graph_vector_search import (
    GraphVectorSearch
)

from sentence_transformers import CrossEncoder


class IncomeTaxHybridSearch:

    def __init__(
        self,
        graph_path: str,
        embedding_path: str,
        model_name: str = "bge-m3",
    ):

        # -------------------------------
        # Normal vector search
        # -------------------------------

        self.vector_search = (
            IncomeTaxVectorSearch(
                embedding_path=embedding_path,
                model_name=model_name,
            )
        )

        # -------------------------------
        # Graph + vector search
        # -------------------------------

        self.graph_search = (
            GraphVectorSearch(
                graph_path=graph_path,
                embedding_path=embedding_path,
                model_name=model_name,
            )
        )

        self.reranker = CrossEncoder(
            "cross-encoder/"
            "ms-marco-MiniLM-L-6-v2"
        )

    def rerank(
        self,
        query,
        results,
        top_k=4,
    ):

        if not results:
            return []

        pairs = []

        for result in results:

            pairs.append([
                query,
                result["text"]
            ])

        scores = self.reranker.predict(
            pairs
        )

        for result, score in zip(
            results,
            scores
        ):

            result[
                "rerank_score"
            ] = float(score)

        results.sort(
            key=lambda x: x[
                "rerank_score"
            ],
            reverse=True
        )

        return results[:top_k]

    def search(
        self,
        query: str,
        vector_top_k: int = 5,
        graph_top_k: int = 2,
    ):

        # =================================
        # 1. Normal vector search
        # =================================

        vector_results = (
            self.vector_search.search(
                query=query,
                top_k=vector_top_k,
            )
        )

        # =================================
        # 2. Graph-enhanced search
        # =================================

        graph_output = (
            self.graph_search.search(
                query=query,
                top_k_per_entity=graph_top_k,
            )
        )

        graph_results = (
            graph_output["results"]
        )

        # =================================
        # 3. Merge results
        # =================================

        merged = {}

        # First add normal vector results
        for result in vector_results:

            chunk_id = str(
                result["id"]
            )

            merged[chunk_id] = result

        # Then add graph results
        for result in graph_results:

            chunk_id = str(
                result["id"]
            )

            if chunk_id not in merged:

                merged[chunk_id] = result

            else:

                # This chunk was found by
                # both retrieval methods

                merged[chunk_id][
                    "retrieval_method"
                ] = "vector+graph"

        # =================================
        # 4. Convert to list
        # =================================

        results = list(
            merged.values()
        )

        reranked_results = self.rerank(
            query=query,
            results=results,
            top_k=4,
        )

        return {
            "query": query,

            "vector_results":
                vector_results,

            "graph_results":
                graph_results,

            "merged_results":
                results,

            "reranked_results":
                reranked_results,

            "graph_queries":
                graph_output[
                    "expanded_queries"
                ],
        }