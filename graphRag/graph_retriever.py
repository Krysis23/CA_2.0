import pickle
from pathlib import Path


class IncomeTaxGraph:

    def __init__(self, graph_path):

        graph_path = Path(graph_path)

        with open(graph_path, "rb") as f:
            self.graph = pickle.load(f)

        print(
            f"Graph loaded: "
            f"{self.graph.number_of_nodes()} nodes, "
            f"{self.graph.number_of_edges()} edges"
        )

    def find_entity(
        self,
        query: str,
        max_results: int = 5
    ):

        import re

        query_lower = query.lower().strip()

        results = []

        # --------------------------------
        # 1. Extract explicit tax sections
        # --------------------------------

        section_matches = re.findall(
            r"\bsection\s+\d+[a-zA-Z]*\b",
            query_lower
        )

        explicit_sections = {
            section.strip()
            for section in section_matches
        }

        # --------------------------------
        # 2. First priority:
        #    exact section match
        # --------------------------------

        for node, attrs in self.graph.nodes(
            data=True
        ):

            name = attrs.get(
                "name",
                str(node)
            )

            name_lower = name.lower().strip()

            # Example:
            # query = "What is Section 87A?"
            # name  = "Section 87A"

            if name_lower in explicit_sections:

                results.append({
                    "node": node,
                    "name": name,
                    "type": attrs.get("type"),
                    "score": 1.0,
                })

        # --------------------------------
        # If exact section found,
        # return those results.
        # --------------------------------

        if results:

            return results[:max_results]

        # --------------------------------
        # 3. Exact entity-name matching
        # --------------------------------

        normalized_query = re.sub(
            r"[^a-z0-9]+",
            " ",
            query_lower
        ).strip()

        for node, attrs in self.graph.nodes(
            data=True
        ):

            name = attrs.get(
                "name",
                str(node)
            )

            normalized_name = re.sub(
                r"[^a-z0-9]+",
                " ",
                name.lower()
            ).strip()

            if (
                normalized_name
                and normalized_name
                in normalized_query
            ):

                results.append({
                    "node": node,
                    "name": name,
                    "type": attrs.get("type"),
                    "score": 1.0,
                })

        # --------------------------------
        # 4. Remove duplicates
        # --------------------------------

        unique = {}

        for result in results:

            unique[result["node"]] = result

        results = list(
            unique.values()
        )

        # --------------------------------
        # 5. Return exact matches only
        # --------------------------------

        if results:

            return results[:max_results]

        return []

    def get_related_entities(
        self,
        node,
        max_results: int = 20
    ):

        results = []

        # Outgoing relationships
        for target in self.graph.successors(
            node
        ):

            edge = self.graph[
                node
            ][target]

            attrs = self.graph.nodes[
                target
            ]

            results.append({
                "node": target,
                "name": attrs.get(
                    "name",
                    str(target)
                ),
                "type": attrs.get(
                    "type"
                ),
                "relation": edge.get(
                    "relation",
                    edge.get("type")
                ),
                "direction": "outgoing"
            })

        # Incoming relationships
        for source in self.graph.predecessors(
            node
        ):

            edge = self.graph[
                source
            ][node]

            attrs = self.graph.nodes[
                source
            ]

            results.append({
                "node": source,
                "name": attrs.get(
                    "name",
                    str(source)
                ),
                "type": attrs.get(
                    "type"
                ),
                "relation": edge.get(
                    "relation",
                    edge.get("type")
                ),
                "direction": "incoming"
            })

        return results[:max_results]