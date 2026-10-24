import { DeferBlockBehavior } from '@angular/core/testing';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import type { MenuAction } from '../ui.types';
import { UiMenu } from './menu';

describe('UiMenu', () => {
  async function setup() {
    const edit = vi.fn();
    const remove = vi.fn();
    const actions: MenuAction[] = [
      { label: 'Edit', command: edit },
      { label: 'Archive', command: vi.fn(), disabled: true },
      { label: 'Delete', command: remove, tone: 'danger' },
    ];
    await render(UiMenu, {
      deferBlockBehavior: DeferBlockBehavior.Playthrough,
      inputs: { actions, triggerLabel: 'Task actions' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Task actions' }));
    await screen.findByRole('menu');
    return { edit, remove };
  }

  it('creates the menu only when it is first opened, then reuses it', async () => {
    await render(UiMenu, {
      deferBlockBehavior: DeferBlockBehavior.Playthrough,
      inputs: { actions: [{ label: 'Edit', command: vi.fn() }], triggerLabel: 'Task actions' },
    });
    expect(document.querySelector('p-menu')).toBeNull();

    const trigger = screen.getByRole('button', { name: 'Task actions' });
    await userEvent.click(trigger);
    expect(await screen.findByRole('menu')).toBeInTheDocument();

    await userEvent.click(trigger);
    await vi.waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await userEvent.click(trigger);
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(document.querySelectorAll('p-menu')).toHaveLength(1);
  });

  it('runs the chosen action', async () => {
    const { edit } = await setup();

    const item = screen.getByRole('menuitem', { name: 'Edit' });
    await userEvent.click(within(item).getByText('Edit'));

    expect(edit).toHaveBeenCalledTimes(1);
  });

  it('tells assistive technology that the button opens a menu', async () => {
    await setup();

    const trigger = screen.getByRole('button', { name: 'Task actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await vi.waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
  });

  it('marks disabled and destructive actions', async () => {
    await setup();

    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass('ui-menu-item-danger');
  });

  it('can use its content as the button', async () => {
    const choose = vi.fn();
    await render(
      `<ui-menu trigger="content" triggerLabel="High priority. Change priority" [actions]="actions">
        <span>High</span>
      </ui-menu>`,
      {
        deferBlockBehavior: DeferBlockBehavior.Playthrough,
        imports: [UiMenu],
        componentProperties: { actions: [{ label: 'Low', command: choose }] },
      },
    );

    const trigger = screen.getByRole('button', { name: 'High priority. Change priority' });
    expect(trigger).toHaveTextContent('High');
    expect(trigger.querySelector('svg')).toBeNull();

    await userEvent.click(trigger);
    const item = await screen.findByRole('menuitem', { name: 'Low' });
    await userEvent.click(within(item).getByText('Low'));
    expect(choose).toHaveBeenCalled();
  });
});
