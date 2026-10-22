import { buildTaskDto } from '../../../testing/builders';
import { isTaskOverdue, toTask } from '.';

const today = '2026-10-21';

describe('isTaskOverdue', () => {
  it('is true for an open task due before today', () => {
    expect(isTaskOverdue({ status: 'in_progress', dueDate: '2026-10-20' }, today)).toBe(true);
  });

  it('is false for a task due today', () => {
    expect(isTaskOverdue({ status: 'todo', dueDate: today }, today)).toBe(false);
  });

  it('is false for a done task even when the due date has passed', () => {
    expect(isTaskOverdue({ status: 'done', dueDate: '2026-10-01' }, today)).toBe(false);
  });
});

describe('toTask', () => {
  it('derives isOverdue instead of trusting the stored flag', () => {
    const dto = buildTaskDto({ dueDate: '2026-10-25', isOverdue: true });
    expect(toTask(dto, today).isOverdue).toBe(false);
  });

  it('fills missing optional fields with defaults', () => {
    const dto = buildTaskDto({
      description: undefined,
      tags: undefined,
      checklist: undefined,
      position: undefined,
      completedAt: undefined,
    });

    expect(toTask(dto, today)).toMatchObject({
      description: '',
      tags: [],
      checklist: [],
      position: 0,
      completedAt: null,
    });
  });

  it('keeps provided values', () => {
    const dto = buildTaskDto({ status: 'done', completedAt: '2026-10-20T09:00:00.000Z' });
    const task = toTask(dto, today);

    expect(task).toMatchObject({
      id: dto.id,
      title: dto.title,
      status: 'done',
      completedAt: '2026-10-20T09:00:00.000Z',
      assignee: dto.assignee,
    });
  });
});
