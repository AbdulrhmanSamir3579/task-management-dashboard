import { render, screen, within } from '@testing-library/angular';
import { type Activity, CURRENT_USER_ACTOR } from '../../../../core/models';
import { ActivityList } from './activity-list';
import { describeActivity } from './describe-activity';

const entry = (overrides: Partial<Activity>): Activity => ({
  id: 'a1',
  type: 'created',
  taskId: 'task-001',
  taskTitle: 'Prepare budget',
  actor: 'Sarah Smith',
  timestamp: '2026-10-22T11:55:00.000Z',
  ...overrides,
});

describe('describeActivity', () => {
  it.each<[Partial<Activity>, string, string]>([
    [{ type: 'created' }, '➕', 'created'],
    [{ type: 'updated' }, '✏️', 'updated'],
    [{ type: 'deleted' }, '🗑️', 'deleted'],
    [{ type: 'status_changed', toStatus: 'in_progress' }, '🔄', 'moved'],
    [{ type: 'status_changed', toStatus: 'done' }, '✅', 'moved'],
  ])('describes %j', (overrides, icon, action) => {
    expect(describeActivity(entry(overrides))).toMatchObject({ icon, action });
  });

  it('names the new status of a moved task', () => {
    expect(describeActivity(entry({ type: 'status_changed', toStatus: 'done' })).detail).toBe(
      ' to Done',
    );
    expect(describeActivity(entry({ type: 'status_changed' })).detail).toBe('');
  });
});

describe('ActivityList', () => {
  const now = new Date('2026-10-22T12:00:00.000Z');

  async function setup(activities: Activity[], newSince: string | null = null) {
    await render(ActivityList, { inputs: { activities, now, newSince } });
  }

  it('lists who did what to which task, and when', async () => {
    await setup([
      entry({ id: 'a2', type: 'status_changed', toStatus: 'done', actor: CURRENT_USER_ACTOR }),
      entry({ id: 'a1', timestamp: '2026-10-21T09:00:00.000Z' }),
    ]);

    const [moved, created] = screen.getAllByRole('listitem');
    expect(moved).toHaveTextContent('You moved Prepare budget to Done');
    expect(within(moved!).getByText('5 minutes ago')).toHaveAttribute(
      'datetime',
      '2026-10-22T11:55:00.000Z',
    );
    expect(created).toHaveTextContent('Sarah Smith created Prepare budget');
    expect(within(created!).getByText('yesterday')).toBeInTheDocument();
  });

  it('marks entries by others since the last visit as new', async () => {
    await setup(
      [
        entry({ id: 'a3', actor: CURRENT_USER_ACTOR }),
        entry({ id: 'a2', timestamp: '2026-10-22T11:00:00.000Z' }),
        entry({ id: 'a1', timestamp: '2026-10-22T09:00:00.000Z' }),
      ],
      '2026-10-22T10:00:00.000Z',
    );

    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.textContent?.includes('New:'))).toEqual([false, true, false]);
  });

  it('says when there is no activity', async () => {
    await setup([]);

    expect(screen.getByText('No activity yet.')).toBeInTheDocument();
  });
});
