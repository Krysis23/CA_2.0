import { describe, expect, it } from 'vitest';
import { buildDocDataPayload } from '../lib/chatUtils';

describe('buildDocDataPayload', () => {
  it('includes every uploaded document in the ask payload instead of only the most recent one', () => {
    const uploadedDocs = [
      { filename: 'jan.pdf', doc_data: { id: 'jan' } },
      { filename: 'feb.pdf', doc_data: { id: 'feb' } },
      { filename: 'mar.pdf', doc_data: { id: 'mar' } },
    ];

    expect(buildDocDataPayload(uploadedDocs, null)).toEqual([
      { id: 'jan' },
      { id: 'feb' },
      { id: 'mar' },
    ]);
  });

  it('falls back to the latest document when no uploaded docs are present', () => {
    expect(buildDocDataPayload([], { id: 'latest' })).toEqual([{ id: 'latest' }]);
  });
});
