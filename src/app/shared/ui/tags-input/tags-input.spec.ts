import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { UiTagsInput } from './tags-input';

describe('UiTagsInput', () => {
  async function setup(initial: string[] = [], max?: number) {
    const control = new FormControl<string[]>(initial, { nonNullable: true });
    await render(
      `<ui-tags-input inputId="tags" placeholder="Add a tag" [max]="max" [formControl]="control" />`,
      { imports: [UiTagsInput, ReactiveFormsModule], componentProperties: { control, max } },
    );
    return { control, input: screen.getByRole('textbox') };
  }

  it('adds tags with Enter and comma, trimming spaces', async () => {
    const { control, input } = await setup();

    await userEvent.type(input, '  Docs {Enter}Backend,');

    expect(control.value).toEqual(['Docs', 'Backend']);
    expect(input).toHaveValue('');
  });

  it('ignores empty and duplicate tags, whatever the case', async () => {
    const { control, input } = await setup(['Docs']);

    await userEvent.type(input, '   {Enter}docs{Enter}');

    expect(control.value).toEqual(['Docs']);
  });

  it('removes a tag with its remove button', async () => {
    const { control } = await setup(['Docs', 'Backend']);

    await userEvent.click(await screen.findByRole('button', { name: 'Remove Docs' }));

    expect(control.value).toEqual(['Backend']);
  });

  it('removes the last tag with Backspace on an empty input', async () => {
    const { control, input } = await setup(['Docs', 'Backend']);

    await userEvent.type(input, '{Backspace}');

    expect(control.value).toEqual(['Docs']);
  });

  it('keeps typed text and marks the control touched on blur', async () => {
    const { control, input } = await setup();

    await userEvent.type(input, 'Frontend');
    await userEvent.tab();

    expect(control.value).toEqual(['Frontend']);
    expect(control.touched).toBe(true);
  });

  it('stops accepting tags once the maximum is reached', async () => {
    const { control, input } = await setup(['Docs'], 2);

    await userEvent.type(input, 'Backend{Enter}');

    expect(control.value).toEqual(['Docs', 'Backend']);
    await vi.waitFor(() => expect(input).toBeDisabled());
  });

  it('lists current tags for screen readers', async () => {
    await setup(['Docs']);
    expect(await screen.findByRole('list', { name: 'Tags' })).toHaveTextContent('Docs');
  });
});
