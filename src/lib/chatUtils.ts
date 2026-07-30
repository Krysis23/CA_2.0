export function buildDocDataPayload(
  uploadedDocs: Array<{ doc_data?: Record<string, unknown> | null } | undefined>,
  fallbackDocData: Record<string, unknown> | null | undefined
) {
  const docs = uploadedDocs
    .map((doc) => doc?.doc_data)
    .filter((doc): doc is Record<string, unknown> => Boolean(doc));

  if (docs.length > 0) {
    return docs;
  }

  return fallbackDocData ? [fallbackDocData] : [];
}
