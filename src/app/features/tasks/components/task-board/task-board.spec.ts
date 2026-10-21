import { CdkDropList } from '@angular/cdk/drag-drop';
import { By } from '@angular/platform-browser';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTask } from '../../../../../testing/builders';
import type { Task, TaskStatus } from '../../../../core/models';
import type { TaskColumns } from '../../data-access/task-filters';
import type { TaskChangeState } from '../../data-access/tasks.store';
import { TaskBoard } from './task-board';

const a = buildTask({ id: 'a', title: 'Alpha', status: 'todo', position: 0 });
const b = buildTask({ id: 'b', title: 'Bravo', status: 'todo', position: 1 });
const c = buildTask({ id: 'c', title: 'Charlie', status: 'done', position: 0 });
const columns: TaskColumns = { todo: [a, b], in_progress: [], done: [c] };

describe('TaskBoard', () => {
  async function setup(
    options: { statuses?: TaskStatus[]; changeStates?: Record<string, TaskChangeState> } = {},
  ) {
    const dropped = vi.fn();
    const moveRequest = vi.fn();
    const deleteRequest = vi.fn();
    const view = await render(TaskBoard, {
      inputs: {
        columns,
        today: '2026-10-21',
        ...(options.statuses ? { statuses: options.statuses } : {}),
        ...(options.changeStates ? { changeStates: options.changeStates } : {}),
      },
      on: { dropped, moveRequest, deleteRequest },
    });
    const dropLists = view.fixture.debugElement.queryAll(By.directive(CdkDropList));
    const drop = (
      from: number,
      to: number,
      task: Task,
      previousIndex: number,
      currentIndex: number,
      data: { todo: Task[]; in_progress: Task[]; done: Task[] } = columns,
    ) => {
      const statusAt = ['todo', 'in_progress', 'done'] as const;
      const source = { data: data[statusAt[from]!] };
      const target = from === to ? source : { data: data[statusAt[to]!] };
      dropLists[to]!.triggerEventHandler('cdkDropListDropped', {
        previousContainer: source,
        container: target,
        previousIndex,
        currentIndex,
        item: { data: task },
      });
    };
    return { dropped, moveRequest, deleteRequest, drop };
  }

  it('shows each column with its title, count and cards in order', async () => {
    await setup();

    const todo = screen.getByRole('region', { name: 'To Do' });
    expect(within(todo).getByLabelText('2 tasks')).toHaveTextContent('2');
    expect(
      within(todo)
        .getAllByRole('article')
        .map((card) => card.getAttribute('aria-label')),
    ).toEqual(['Alpha', 'Bravo']);
    expect(
      within(screen.getByRole('region', { name: 'In Progress' })).getByText('No tasks'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Done' })).getByLabelText('1 task'),
    ).toBeInTheDocument();
  });

  it('shows only the selected columns', async () => {
    await setup({ statuses: ['done'] });

    expect(
      screen.getAllByRole('region').map((region) => region.getAttribute('aria-labelledby')),
    ).toEqual(['column-title-done']);
  });

  it('reports a drop into another column before a card', async () => {
    const { dropped, drop } = await setup();

    drop(2, 0, c, 0, 1);

    expect(dropped).toHaveBeenCalledWith({ taskId: 'c', status: 'todo', beforeTaskId: 'b' });
  });

  it('reports a drop at the end of a column', async () => {
    const { dropped, drop } = await setup();

    drop(0, 2, a, 0, 1);

    expect(dropped).toHaveBeenCalledWith({ taskId: 'a', status: 'done', beforeTaskId: null });
  });

  it('reports a reorder inside a column', async () => {
    const { dropped, drop } = await setup();

    drop(0, 0, b, 1, 0);

    expect(dropped).toHaveBeenCalledWith({ taskId: 'b', status: 'todo', beforeTaskId: 'a' });
  });

  it('ignores a drop in the same place', async () => {
    const { dropped, drop } = await setup();

    drop(0, 0, a, 0, 0);

    expect(dropped).not.toHaveBeenCalled();
  });

  it('passes card actions up with their task', async () => {
    const { moveRequest, deleteRequest } = await setup();

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Charlie' }));
    let item = await screen.findByRole('menuitem', { name: 'Move to To Do' });
    await userEvent.click(within(item).getByText('Move to To Do'));
    expect(moveRequest).toHaveBeenCalledWith({ task: c, status: 'todo' });

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Charlie' }));
    item = await screen.findByRole('menuitem', { name: 'Delete' });
    await userEvent.click(within(item).getByText('Delete'));
    expect(deleteRequest).toHaveBeenCalledWith(c);
  });

  it('shows the change state on cards and stops saving cards from being dragged', async () => {
    await setup({ changeStates: { a: 'saving', c: 'failed' } });

    const alpha = screen.getByRole('article', { name: 'Alpha' }).parentElement!;
    expect(alpha).toHaveClass('task-card--saving', 'cdk-drag-disabled');
    expect(screen.getByRole('article', { name: 'Charlie' }).parentElement).toHaveClass(
      'task-card--failed',
    );
  });
});
