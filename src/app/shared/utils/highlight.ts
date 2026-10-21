export interface HighlightPart {
  text: string;
  match: boolean;
}

const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

/**
 * Splits `text` into the parts that match `query` (case-insensitive) and the parts that
 * do not, so templates can wrap matches in `<mark>` without using `innerHTML`.
 */
export function highlightParts(text: string, query: string): HighlightPart[] {
  const term = query.trim();
  if (!text) {
    return [];
  }
  if (!term) {
    return [{ text, match: false }];
  }
  const pattern = new RegExp(`(${term.replace(REGEX_SPECIAL_CHARACTERS, '\\$&')})`, 'gi');
  // With a capturing group, split() puts the matches at odd indexes.
  return text
    .split(pattern)
    .map((part, index) => ({ text: part, match: index % 2 === 1 }))
    .filter((part) => part.text !== '');
}
