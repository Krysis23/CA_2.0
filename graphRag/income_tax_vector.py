import joblib
import numpy as np
import ollama


class IncomeTaxVectorSearch:

    def __init__(
        self,
        embedding_path: str,
        model_name: str = "bge-m3",
    ):
        # Load existing Income Tax embeddings
        data = joblib.load(
            embedding_path
        )

        self.ids = data["ids"]
        self.texts = data["texts"]
        self.pages = data["pages"]
        self.chunks = data["chunks"]

        self.embeddings = np.asarray(
            data["embeddings"],
            dtype=np.float32,
        )

        self.model_name = model_name

        print(
            f"Loaded {len(self.texts)} chunks"
        )

        print(
            "Embedding shape:",
            self.embeddings.shape,
        )

        print(
            "Embedding model:",
            data["model"],
        )

    def embed_query(
        self,
        query: str,
    ):

        response = ollama.embed(
            model=self.model_name,
            input=query,
        )

        embedding = np.asarray(
            response["embeddings"][0],
            dtype=np.float32,
        )

        return embedding

    def search(
        self,
        query: str,
        top_k: int = 5,
    ):

        # --------------------------------
        # Generate query embedding
        # --------------------------------

        query_embedding = self.embed_query(
            query
        )

        # --------------------------------
        # Check dimensions
        # --------------------------------

        if (
            query_embedding.shape[0]
            != self.embeddings.shape[1]
        ):
            raise ValueError(
                "Embedding dimension mismatch!\n"
                f"Query embedding: "
                f"{query_embedding.shape[0]}\n"
                f"Stored embeddings: "
                f"{self.embeddings.shape[1]}"
            )

        # --------------------------------
        # Normalize query
        # --------------------------------

        query_norm = np.linalg.norm(
            query_embedding
        )

        if query_norm == 0:
            raise ValueError(
                "Query embedding has zero norm."
            )

        query_embedding = (
            query_embedding / query_norm
        )

        # --------------------------------
        # Normalize stored embeddings
        # --------------------------------

        stored_norms = np.linalg.norm(
            self.embeddings,
            axis=1,
            keepdims=True,
        )

        normalized_embeddings = (
            self.embeddings
            / np.maximum(
                stored_norms,
                1e-12,
            )
        )

        # --------------------------------
        # Cosine similarity
        # --------------------------------

        scores = (
            normalized_embeddings
            @ query_embedding
        )

        # --------------------------------
        # Top K
        # --------------------------------

        top_indices = np.argsort(
            scores
        )[::-1][:top_k]

        results = []

        for index in top_indices:

            index = int(index)

            results.append({

                "id":
                    self.ids[index],

                "text":
                    self.texts[index],

                "page":
                    self.pages[index],

                "chunk":
                    self.chunks[index],

                "score":
                    float(scores[index]),

                "retrieval_method":
                    "vector",

            })

        return results