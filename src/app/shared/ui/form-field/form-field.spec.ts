import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { UiInputText } from '../input-text/input-text';
import { UiSelect } from '../select/select';
import { UiFormField } from './form-field';

describe('UiFormField', () => {
  async function setup(
    control: FormControl<string>,
    extras: { hint?: string; messages?: Record<string, string> } = {},
  ) {
    await render(
      `<ui-form-field label="Title" [control]="control" [hint]="hint" [messages]="messages">
         <ui-input-text [formControl]="control" />
       </ui-form-field>`,
      {
        imports: [UiFormField, UiInputText, ReactiveFormsModule],
        componentProperties: { control, hint: extras.hint, messages: extras.messages ?? {} },
      },
    );
    return screen.getByRole('textbox', { name: /Title/ });
  }

  it('links its label to the control inside', async () => {
    const input = await setup(new FormControl('', { nonNullable: true }));
    expect(input).toBeInTheDocument();
  });

  it('marks required fields', async () => {
    await setup(new FormControl('', { nonNullable: true, validators: Validators.required }));
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('waits until the field is touched before showing an error', async () => {
    const input = await setup(
      new FormControl('', { nonNullable: true, validators: Validators.required }),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await userEvent.click(input);
    await userEvent.tab();

    const error = await screen.findByRole('alert');
    expect(error).toHaveTextContent('This field is required.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', error.id);
  });

  it('removes the error once the value is fixed', async () => {
    const input = await setup(
      new FormControl('', { nonNullable: true, validators: Validators.required }),
    );
    await userEvent.click(input);
    await userEvent.tab();
    await screen.findByRole('alert');

    await userEvent.type(input, 'Fixed');

    await vi.waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('prefers custom messages, then validator strings, then defaults', async () => {
    const control = new FormControl('ab', {
      nonNullable: true,
      validators: Validators.minLength(3),
    });
    control.markAsTouched();
    await setup(control, { messages: { required: 'Give the task a title.' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Use at least 3 characters.');

    control.setErrors({ required: true });
    await vi.waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Give the task a title.'),
    );

    control.setErrors({ titleTaken: 'A task with this title already exists.' });
    await vi.waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('A task with this title already exists.'),
    );

    control.setErrors({ somethingElse: true });
    await vi.waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid value.'),
    );
  });

  it('shows the hint while the field is valid and links it to the control', async () => {
    const input = await setup(new FormControl('', { nonNullable: true }), {
      hint: 'Keep it short',
    });

    const hint = screen.getByText('Keep it short');
    expect(input).toHaveAttribute('aria-describedby', hint.id);
  });

  it('names selects after the label, which a label element cannot do for them', async () => {
    const control = new FormControl<string | null>(null);
    await render(
      `<ui-form-field label="Assignee" [control]="control">
         <ui-select [formControl]="control" [options]="options" />
       </ui-form-field>`,
      {
        imports: [UiFormField, UiSelect, ReactiveFormsModule],
        componentProperties: { control, options: [{ label: 'John Doe', value: 'user-001' }] },
      },
    );

    expect(screen.getByRole('combobox', { name: 'Assignee' })).toBeInTheDocument();
  });
});
