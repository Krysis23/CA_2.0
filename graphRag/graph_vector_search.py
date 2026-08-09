from graph_query_expander import GraphQueryExpander
from income_tax_vector import IncomeTaxVectorSearch


class GraphVectorSearch:

    def __init__(
        self,
        graph_path: str,
        embedding_path: str,
        model_name: str = "bge-m3",
    ):

        self.expander = GraphQueryExpander(
            graph_path
        )

        self.vector_search = (
            IncomeTaxVectorSearch(
                embedding_path=embedding_path,
                model_name=model_name,
            )
        )

    def search(
        self,
        query: str,
        top_k_per_entity: int = 2,
    ):

        # --------------------------------
        # 1. Expand query using graph
        # --------------------------------

        expansion = self.expander.expand(
            query=query,
            max_entities=3,
            max_related=5,
        )

        expanded_queries = (
            expansion["expanded_queries"]
        )

        # --------------------------------
        # 2. Search each graph entity
        #    using BGE-M3
        # --------------------------------

        graph_results = []

        for entity_query in expanded_queries:

            results = (
                self.vector_search.search(
                    query=entity_query,
                    top_k=top_k_per_entity,
                )
            )

            for result in results:

                result[
                    "retrieval_method"
                ] = "graph"

                result[
                    "graph_query"
                ] = entity_query

                graph_results.append(
                    result
                )

        # --------------------------------
        # 3. Deduplicate chunks
        # --------------------------------

        unique_results = {}

        for result in graph_results:

            chunk_id = str(
                result["id"]
            )

            if chunk_id not in unique_results:

                unique_results[
                    chunk_id
                ] = result

        return {
            "original_query": query,

            "expanded_queries":
                expanded_queries,

            "results":
                list(
                    unique_results.values()
                ),
        }