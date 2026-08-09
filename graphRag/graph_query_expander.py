from graph_retriever import IncomeTaxGraph


class GraphQueryExpander:

    def __init__(
        self,
        graph_path: str,
    ):
        self.graph = IncomeTaxGraph(
            graph_path
        )

    def expand(
        self,
        query: str,
        max_entities: int = 3,
        max_related: int = 5,
    ):

        # --------------------------------
        # Find entities matching query
        # --------------------------------

        entities = self.graph.find_entity(
            query,
            max_results=max_entities,
        )

        expanded_queries = []

        # --------------------------------
        # Add matched entities
        # --------------------------------

        for entity in entities:

            expanded_queries.append(
                entity["name"]
            )

            # --------------------------------
            # Find related entities
            # --------------------------------

            related = (
                self.graph.get_related_entities(
                    entity["node"],
                    max_results=max_related,
                )
            )

            for item in related:

                expanded_queries.append(
                    item["name"]
                )

        # --------------------------------
        # Remove duplicates
        # --------------------------------

        expanded_queries = list(
            dict.fromkeys(
                expanded_queries
            )
        )

        return {
            "original_query": query,
            "matched_entities": entities,
            "expanded_queries": expanded_queries,
        }