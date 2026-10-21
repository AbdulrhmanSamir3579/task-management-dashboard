import { describeDueDate } from './due-date';

const today = '2026-10-21';

describe('describeDueDate', () => {
  it.each([
    ['2026-10-20', '⚠️', 'Overdue by 1 day', 'overdue'],
    ['2026-10-18', '⚠️', 'Overdue by 3 days', 'overdue'],
    ['2026-10-21', '📅', 'Due today', 'soon'],
    ['2026-10-22', '📅', 'Due tomorrow', 'soon'],
    ['2026-10-26', '📅', 'Due in 5 days', 'upcoming'],
  ])('describes a task due %s', (dueDate, icon, label, tone) => {
    expect(describeDueDate({ status: 'todo', dueDate }, today)).toEqual({ icon, label, tone });
  });

  it('describes done tasks as completed, whatever the due date', () => {
    expect(describeDueDate({ status: 'done', dueDate: '2026-10-01' }, today)).toEqual({
      icon: '✅',
      label: 'Completed',
      tone: 'done',
    });
  });
});
