interface Searchable {
  title: string;
  description?: string | null;
}

/**
 * Items whose title or description contains `query` (case-insensitive), title matches
 * first. An empty query returns every item. Shared by the mock API and the client, so
 * local and server search order results the same way.
 */
export function rankByText<T extends Searchable>(items: readonly T[], query: string): T[] {
  const term = query.trim().toLowerCase();
  if (!term) {
    return [...items];
  }
  const inTitle = (item: T): boolean => item.title.toLowerCase().includes(term);
  const inDescription = (item: T): boolean => (item.description ?? '').toLowerCase().includes(term);

  return [
    ...items.filter(inTitle),
    ...items.filter((item) => !inTitle(item) && inDescription(item)),
  ];
}
