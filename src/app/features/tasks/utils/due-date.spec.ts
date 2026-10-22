import { TestBed } from '@angular/core/testing';
import { LanguageService } from '../../../core/i18n/language.service';
import { describeDueDate } from './due-date';

const today = '2026-10-21';

describe('describeDueDate', () => {
  const text = (dueDate: string, status: 'todo' | 'done' = 'todo') => {
    const info = describeDueDate({ status, dueDate }, today);
    return [info.icon, TestBed.inject(LanguageService).text(info.text), info.tone];
  };

  it.each([
    ['2026-10-20', '⚠️', 'Overdue by 1 day', 'overdue'],
    ['2026-10-18', '⚠️', 'Overdue by 3 days', 'overdue'],
    ['2026-10-21', '📅', 'Due today', 'soon'],
    ['2026-10-22', '📅', 'Due tomorrow', 'soon'],
    ['2026-10-26', '📅', 'Due in 5 days', 'upcoming'],
  ])('describes a task due %s', (dueDate, icon, label, tone) => {
    expect(text(dueDate)).toEqual([icon, label, tone]);
  });

  it('describes done tasks as completed, whatever the due date', () => {
    expect(text('2026-10-01', 'done')).toEqual(['✅', 'Completed', 'done']);
  });

  it('counts the days in the text, so each language can use its plural forms', () => {
    expect(describeDueDate({ status: 'todo', dueDate: '2026-10-18' }, today).text).toEqual({
      plural: 'DUE.OVERDUE_BY',
      count: 3,
    });
  });
});
