import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { UiDatePicker } from './date-picker';

describe('UiDatePicker', () => {
  async function setup(initial: string | null) {
    const control = new FormControl<string | null>(initial);
    await render(
      `<ui-date-picker inputId="due" ariaLabel="Due date" minDate="2026-10-01" [formControl]="control" />`,
      { imports: [UiDatePicker, ReactiveFormsModule], componentProperties: { control } },
    );
    return { control, input: screen.getByRole('combobox', { name: 'Due date' }) };
  }

  it('displays an ISO date from the form in a readable format', async () => {
    const { input } = await setup('2026-10-23');
    await vi.waitFor(() => expect(input).toHaveValue('Oct 23, 2026'));
  });

  it('writes the picked day back as an ISO date and marks the control touched', async () => {
    const { control, input } = await setup('2026-10-23');

    await userEvent.click(input);
    await userEvent.click(await screen.findByText('25'));
    await userEvent.click(document.body);

    expect(control.value).toBe('2026-10-25');
  });

  it('clears the value when the form resets', async () => {
    const { control, input } = await setup('2026-10-23');

    control.reset();

    await vi.waitFor(() => expect(input).toHaveValue(''));
    expect(control.value).toBeNull();
  });
});
