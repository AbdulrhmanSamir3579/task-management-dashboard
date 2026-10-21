import type { TaskStatus } from '../../core/models';

/** Anything that sits in a board column. */
export interface BoardItem {
  id: string;
  status: TaskStatus;
  position?: number;
}

const byPosition = (a: BoardItem, b: BoardItem): number => (a.position ?? 0) - (b.position ?? 0);

/** Positions 0..n-1 for the items of one column, keyed by id. */
function renumber<T extends BoardItem>(column: readonly T[]): Map<string, T> {
  return new Map(column.map((item, position) => [item.id, { ...item, position }]));
}

/**
 * Moves an item to `status` at `position` (end of the column when omitted) and renumbers
 * the columns it left and entered. Used by the mock API and by the store for optimistic
 * updates, so both order the board the same way.
 */
export function moveOnBoard<T extends BoardItem>(
  items: readonly T[],
  id: string,
  status: TaskStatus,
  position?: number,
): T[] {
  const moving = items.find((item) => item.id === id);
  if (!moving) {
    return [...items];
  }

  const target = items.filter((item) => item.status === status && item.id !== id).sort(byPosition);
  const index = Math.min(Math.max(position ?? target.length, 0), target.length);
  target.splice(index, 0, { ...moving, status });

  const source =
    moving.status === status
      ? []
      : items.filter((item) => item.status === moving.status && item.id !== id).sort(byPosition);

  const updates = new Map([...renumber(source), ...renumber(target)]);
  return items.map((item) => updates.get(item.id) ?? item);
}

/** Removes an item and closes the gap it leaves in its column. */
export function removeFromBoard<T extends BoardItem>(items: readonly T[], id: string): T[] {
  const removed = items.find((item) => item.id === id);
  const remaining = items.filter((item) => item.id !== id);
  if (!removed) {
    return remaining;
  }

  const updates = renumber(
    remaining.filter((item) => item.status === removed.status).sort(byPosition),
  );
  return remaining.map((item) => updates.get(item.id) ?? item);
}
