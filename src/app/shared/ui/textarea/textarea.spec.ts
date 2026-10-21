import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { UiTextarea } from './textarea';

describe('UiTextarea', () => {
  it('connects to a form control in both directions', async () => {
    const control = new FormControl('Initial', { nonNullable: true });
    await render(
      `<ui-textarea placeholder="Description" [rows]="4" [invalid]="true" [formControl]="control" />`,
      { imports: [UiTextarea, ReactiveFormsModule], componentProperties: { control } },
    );
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveValue('Initial');
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');

    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Updated');
    await userEvent.tab();

    expect(control.value).toBe('Updated');
    expect(control.touched).toBe(true);
  });
});
