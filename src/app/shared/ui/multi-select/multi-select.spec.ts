import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import type { SelectOption } from '../ui.types';
import { UiMultiSelect } from './multi-select';

const options: SelectOption<string>[] = [
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
];

describe('UiMultiSelect', () => {
  it('adds chosen options to the form control value', async () => {
    const control = new FormControl<string[]>(['todo'], { nonNullable: true });
    await render(
      `<ui-multi-select ariaLabel="Status" [options]="options" [formControl]="control" />`,
      { imports: [UiMultiSelect, ReactiveFormsModule], componentProperties: { control, options } },
    );

    screen.getByRole('combobox', { name: 'Status' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.click(await screen.findByRole('option', { name: 'Done' }));

    expect(control.value).toEqual(['todo', 'done']);
  });

  it('treats a reset to null as no selection', async () => {
    const control = new FormControl<string[] | null>(['todo']);
    await render(
      `<ui-multi-select ariaLabel="Status" [options]="options" [formControl]="control" />`,
      { imports: [UiMultiSelect, ReactiveFormsModule], componentProperties: { control, options } },
    );

    control.setValue(null);

    await vi.waitFor(() => expect(screen.queryByText('To Do')).not.toBeInTheDocument());
  });
});
