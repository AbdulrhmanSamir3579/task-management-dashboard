import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { UiCheckbox } from './checkbox';

describe('UiCheckbox', () => {
  async function setup(template: string, initial = false) {
    const control = new FormControl(initial, { nonNullable: true });
    await render(template, {
      imports: [UiCheckbox, ReactiveFormsModule],
      componentProperties: { control },
    });
    return control;
  }

  it('toggles the form control from its visible label', async () => {
    const control = await setup(`<ui-checkbox label="Mark as done" [formControl]="control" />`);
    const checkbox = screen.getByRole('checkbox', { name: 'Mark as done' });

    await userEvent.click(screen.getByText('Mark as done'));
    expect(control.value).toBe(true);
    expect(checkbox).toBeChecked();

    await userEvent.click(checkbox);
    expect(control.value).toBe(false);
  });

  it('shows the value set by the form and uses the aria label without a visible label', async () => {
    const control = await setup(`<ui-checkbox ariaLabel="Done: Draft" [formControl]="control" />`);

    control.setValue(true);

    await vi.waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'Done: Draft' })).toBeChecked(),
    );
  });

  it('follows the disabled state and marks the control touched', async () => {
    const control = await setup(`<ui-checkbox label="Done" [formControl]="control" />`);
    const checkbox = screen.getByRole('checkbox', { name: 'Done' });

    await userEvent.click(checkbox);
    await userEvent.tab();
    expect(control.touched).toBe(true);

    control.disable();
    await vi.waitFor(() => expect(checkbox).toBeDisabled());
  });
});
