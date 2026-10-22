import { TestBed } from '@angular/core/testing';
import { buildTask, buildUser } from '../../../../testing/builders';
import { LanguageService } from '../../../core/i18n/language.service';
import type { TranslationKey } from '../../../core/i18n/translation-key';
import {
  completionTrend,
  tasksByPriority,
  tasksByStatus,
  workloadByAssignee,
} from './task-analytics';

const john = buildUser({ id: 'user-001', name: 'John Doe' });
const sarah = buildUser({ id: 'user-002', name: 'Sarah Smith' });
const mike = buildUser({ id: 'user-003', name: 'Mike Johnson' });

const tasks = [
  buildTask({ id: 'a', status: 'todo', priority: 'high', assignee: john }),
  buildTask({ id: 'b', status: 'done', priority: 'high', assignee: sarah }),
  buildTask({ id: 'c', status: 'in_progress', priority: 'low', assignee: sarah }),
  buildTask({ id: 'd', status: 'done', priority: 'medium', assignee: mike }),
];

describe('task analytics', () => {
  const t = (key: TranslationKey) => TestBed.inject(LanguageService).t(key);

  it('counts tasks per status in board order, with the board colours', () => {
    expect(tasksByStatus(tasks, t)).toEqual([
      { label: 'To Do', value: 1, tone: 'primary' },
      { label: 'In Progress', value: 1, tone: 'warning' },
      { label: 'Done', value: 2, tone: 'success' },
    ]);
  });

  it('counts tasks per priority from high to low', () => {
    expect(tasksByPriority(tasks, t)).toEqual([
      { label: 'High', value: 2, tone: 'danger' },
      { label: 'Medium', value: 1, tone: 'warning' },
      { label: 'Low', value: 1, tone: 'success' },
    ]);
  });

  it('splits each assignee’s tasks by status, busiest first and then by name', () => {
    expect(workloadByAssignee(tasks, t)).toEqual({
      categories: ['Sarah Smith', 'John Doe', 'Mike Johnson'],
      series: [
        { name: 'To Do', tone: 'primary', values: [0, 1, 0] },
        { name: 'In Progress', tone: 'warning', values: [1, 0, 0] },
        { name: 'Done', tone: 'success', values: [1, 0, 1] },
      ],
    });
  });

  it('counts tasks created and completed per day over the last days', () => {
    const local = (day: string, time = '10:00') => new Date(`${day}T${time}:00`).toISOString();
    const trend = completionTrend(
      [
        buildTask({ createdAt: local('2026-10-20'), completedAt: local('2026-10-22', '09:00') }),
        buildTask({ createdAt: local('2026-10-20', '23:30'), completedAt: null }),
        buildTask({ createdAt: local('2026-10-01') }),
      ],
      '2026-10-22',
      t,
      'en',
      3,
    );

    expect(trend).toEqual({
      categories: ['Oct 20', 'Oct 21', 'Oct 22'],
      series: [
        { name: 'Created', tone: 'primary', values: [2, 0, 0] },
        { name: 'Completed', tone: 'success', values: [0, 0, 1] },
      ],
    });
  });

  it('formats day labels for the language', () => {
    expect(completionTrend([], '2026-10-22', t, 'ar-u-nu-latn', 1).categories).toEqual([
      new Intl.DateTimeFormat('ar-u-nu-latn', { month: 'short', day: 'numeric' }).format(
        new Date(2026, 9, 22),
      ),
    ]);
  });

  it('covers the last 14 days by default', () => {
    expect(completionTrend([], '2026-10-22', t, 'en').categories).toHaveLength(14);
  });
});
