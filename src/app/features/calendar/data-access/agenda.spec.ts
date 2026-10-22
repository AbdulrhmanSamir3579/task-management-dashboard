import { buildTask } from '../../../../testing/builders';
import { buildAgenda } from './agenda';

describe('buildAgenda', () => {
  const today = '2026-10-22';

  it('groups open tasks into overdue, today, the next 7 days and later', () => {
    const groups = buildAgenda(
      [
        buildTask({ id: 'late', dueDate: '2026-10-20' }),
        buildTask({ id: 'now', dueDate: today }),
        buildTask({ id: 'soon', dueDate: '2026-10-29' }),
        buildTask({ id: 'far', dueDate: '2026-10-30' }),
        buildTask({ id: 'finished', dueDate: '2026-10-20', status: 'done' }),
      ],
      today,
    );

    expect(groups.map((group) => [group.id, group.tasks.map((task) => task.id)])).toEqual([
      ['overdue', ['late']],
      ['today', ['now']],
      ['week', ['soon']],
      ['later', ['far']],
    ]);
    expect(groups.map((group) => group.title)).toEqual([
      'Overdue',
      'Today',
      'Next 7 days',
      'Later',
    ]);
  });

  it('orders each group by due date, then priority, then title', () => {
    const [week] = buildAgenda(
      [
        buildTask({ id: 'b-low', title: 'B', dueDate: '2026-10-24', priority: 'low' }),
        buildTask({ id: 'later', dueDate: '2026-10-25', priority: 'high' }),
        buildTask({ id: 'a-low', title: 'A', dueDate: '2026-10-24', priority: 'low' }),
        buildTask({ id: 'high', dueDate: '2026-10-24', priority: 'high' }),
      ],
      today,
    );

    expect(week?.tasks.map((task) => task.id)).toEqual(['high', 'a-low', 'b-low', 'later']);
  });

  it('leaves out empty groups', () => {
    expect(buildAgenda([buildTask({ dueDate: '2027-01-01' })], today).map((g) => g.id)).toEqual([
      'later',
    ]);
    expect(buildAgenda([], today)).toEqual([]);
  });
});
