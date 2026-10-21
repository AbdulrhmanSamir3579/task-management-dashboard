import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import type { SelectOption } from '../ui.types';
import { UiSelect } from './select';

const options: SelectOption<string>[] = [
  { label: 'John Doe', value: 'user-001' },
  { label: 'Sarah Smith', value: 'user-002' },
];

describe('UiSelect', () => {
  async function setup(initial: string | null = null) {
    const control = new FormControl<string | null>(initial);
    await render(
      `<ui-select ariaLabel="Assignee" placeholder="Pick someone" [options]="options" [formControl]="control" />`,
      { imports: [UiSelect, ReactiveFormsModule], componentProperties: { control, options } },
    );
    return { control };
  }

  it('shows the label of the current value', async () => {
    await setup('user-002');
    expect(await screen.findByText('Sarah Smith')).toBeInTheDocument();
  });

  it('writes the chosen option value into the form control', async () => {
    const { control } = await setup();

    await userEvent.click(screen.getByRole('combobox', { name: 'Assignee' }));
    await userEvent.click(await screen.findByRole('option', { name: 'John Doe' }));

    expect(control.value).toBe('user-001');
  });

  it('follows the disabled state of the form control', async () => {
    const { control } = await setup();

    control.disable();

    await vi.waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Assignee' })).toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
  });
});
