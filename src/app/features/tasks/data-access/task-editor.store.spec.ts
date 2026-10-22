import { TestBed } from '@angular/core/testing';
import { TaskEditorStore } from './task-editor.store';

describe('TaskEditorStore', () => {
  it('opens for a new task, for an existing one, and closes', () => {
    const store = TestBed.inject(TaskEditorStore);
    expect(store.open()).toBe(false);

    store.openCreate();
    expect([store.open(), store.taskId()]).toEqual([true, null]);

    store.openEdit('task-001');
    expect([store.open(), store.taskId()]).toEqual([true, 'task-001']);

    store.close();
    expect([store.open(), store.taskId()]).toEqual([false, null]);
  });

  it('remembers an assignee chosen for a new task until the dialog closes', () => {
    const store = TestBed.inject(TaskEditorStore);

    store.openCreate({ assigneeId: 'user-002' });
    expect(store.assigneeId()).toBe('user-002');

    store.close();
    expect(store.assigneeId()).toBeNull();
    store.openCreate();
    expect(store.assigneeId()).toBeNull();
  });
});
