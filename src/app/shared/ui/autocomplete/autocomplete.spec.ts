import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { UiAutocomplete, UiAutocompleteItem } from './autocomplete';

interface Fruit {
  name: string;
  colour: string;
}

@Component({
  imports: [UiAutocomplete, UiAutocompleteItem],
  template: `
    <ui-autocomplete
      inputId="fruit"
      ariaLabel="Fruit"
      optionLabel="name"
      emptyMessage="Nothing found"
      [suggestions]="suggestions()"
      (queryChange)="queries.push($event)"
      (selected)="chosen = $event"
    >
      @if (customTemplate) {
        <ng-template uiAutocompleteItem [uiAutocompleteItemOf]="suggestions()" let-fruit>
          <strong>{{ fruit.name }}</strong> <small>{{ fruit.colour }}</small>
        </ng-template>
      }
    </ui-autocomplete>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly suggestions = signal<Fruit[]>([]);
  customTemplate = true;
  queries: string[] = [];
  chosen: Fruit | null = null;
}

describe('UiAutocomplete', () => {
  async function setup(customTemplate = true) {
    const { fixture } = await render(Host, { componentProperties: { customTemplate } });
    return {
      host: fixture.componentInstance,
      input: screen.getByRole('combobox', { name: 'Fruit' }),
    };
  }

  it('reports what is typed', async () => {
    const { host, input } = await setup();

    await userEvent.type(input, 'ap');

    await vi.waitFor(() => expect(host.queries.at(-1)).toBe('ap'));
  });

  it('renders suggestions with the custom template and reports the chosen one', async () => {
    const { host, input } = await setup();

    await userEvent.type(input, 'ap');
    host.suggestions.set([
      { name: 'Apple', colour: 'green' },
      { name: 'Apricot', colour: 'orange' },
    ]);

    const option = await screen.findByRole('option', { name: /Apricot/ });
    expect(within(option).getByText('orange')).toBeInTheDocument();

    await userEvent.click(within(option).getByText('Apricot'));

    expect(host.chosen).toEqual({ name: 'Apricot', colour: 'orange' });
    await vi.waitFor(() => expect(input).toHaveValue('Apricot'));
  });

  it('falls back to the option label without a custom template', async () => {
    const { host, input } = await setup(false);

    await userEvent.type(input, 'ap');
    host.suggestions.set([{ name: 'Apple', colour: 'green' }]);

    expect(await screen.findByRole('option', { name: 'Apple' })).toBeInTheDocument();
  });

  it('shows the empty message when nothing matches', async () => {
    const { host, input } = await setup();

    await userEvent.type(input, 'zz');
    host.suggestions.set([]);

    expect(await screen.findByText('Nothing found')).toBeInTheDocument();
  });
});
