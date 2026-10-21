import { signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { FORM_FIELD_CONTEXT } from '../forms/form-control';
import { UiInputText } from './input-text';

describe('UiInputText', () => {
  async function setup(control = new FormControl('', { nonNullable: true })) {
    await render(
      `<ui-input-text inputId="title" placeholder="Title" [maxLength]="20" [formControl]="control" />`,
      { imports: [UiInputText, ReactiveFormsModule], componentProperties: { control } },
    );
    return { control, input: screen.getByRole('textbox') };
  }

  it('writes typed text into the form control', async () => {
    const { control, input } = await setup();

    await userEvent.type(input, 'Write docs');

    expect(control.value).toBe('Write docs');
  });

  it('shows values set by the form, treating null as empty', async () => {
    const { control, input } = await setup();

    control.setValue('From the form');
    await screen.findByDisplayValue('From the form');

    control.reset();
    await vi.waitFor(() => expect(input).toHaveValue(''));
  });

  it('marks the control as touched on blur', async () => {
    const { control, input } = await setup();

    await userEvent.click(input);
    await userEvent.tab();

    expect(control.touched).toBe(true);
  });

  it('follows the disabled state of the form control', async () => {
    const { control, input } = await setup();

    control.disable();

    await vi.waitFor(() => expect(input).toBeDisabled());
  });

  it('applies its id, placeholder and length limit', async () => {
    const { input } = await setup();

    expect(input).toHaveAttribute('id', 'title');
    expect(input).toHaveAttribute('placeholder', 'Title');
    expect(input).toHaveAttribute('maxlength', '20');
  });

  it('takes id, error state and description from a surrounding form field', async () => {
    await render(`<ui-input-text placeholder="Title" />`, {
      imports: [UiInputText],
      providers: [
        {
          provide: FORM_FIELD_CONTEXT,
          useValue: {
            controlId: 'field-title',
            describedBy: signal('field-title-error'),
            invalid: signal(true),
          },
        },
      ],
    });

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'field-title');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'field-title-error');
  });
});
