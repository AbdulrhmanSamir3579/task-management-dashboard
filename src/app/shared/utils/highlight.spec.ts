import { highlightParts } from './highlight';

describe('highlightParts', () => {
  it('marks every match, ignoring case and keeping the original text', () => {
    expect(highlightParts('API docs for the api', ' api ')).toEqual([
      { text: 'API', match: true },
      { text: ' docs for the ', match: false },
      { text: 'api', match: true },
    ]);
  });

  it('treats regex characters in the query as plain text', () => {
    expect(highlightParts('Cost (Q4) report', '(q4)')).toEqual([
      { text: 'Cost ', match: false },
      { text: '(Q4)', match: true },
      { text: ' report', match: false },
    ]);
  });

  it('returns the whole text unmarked for an empty query or no match', () => {
    expect(highlightParts('Write docs', '  ')).toEqual([{ text: 'Write docs', match: false }]);
    expect(highlightParts('Write docs', 'budget')).toEqual([{ text: 'Write docs', match: false }]);
  });

  it('returns nothing for empty text', () => {
    expect(highlightParts('', 'docs')).toEqual([]);
  });
});
