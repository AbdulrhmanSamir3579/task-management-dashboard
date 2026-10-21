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

  describe('auto height', () => {
    let resizeCallback: ResizeObserverCallback | undefined;
    const original = globalThis.ResizeObserver;

    beforeEach(() => {
      globalThis.ResizeObserver = class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback;
        }
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      } as unknown as typeof ResizeObserver;
    });

    afterEach(() => {
      globalThis.ResizeObserver = original;
      resizeCallback = undefined;
    });

    async function setup() {
      const control = new FormControl('', { nonNullable: true });
      await render(`<ui-textarea [formControl]="control" />`, {
        imports: [UiTextarea, ReactiveFormsModule],
        componentProperties: { control },
      });
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      let scrollHeight = 72;
      Object.defineProperty(textarea, 'scrollHeight', { get: () => scrollHeight });
      return { control, textarea, setScrollHeight: (value: number) => (scrollHeight = value) };
    }

    const resize = (width: number) =>
      resizeCallback?.([{ contentRect: { width } } as ResizeObserverEntry], {} as ResizeObserver);

    it('measures again once the field is laid out, e.g. when a dialog opens', async () => {
      const { textarea } = await setup();
      await vi.waitFor(() => expect(resizeCallback).toBeDefined());

      resize(480);

      expect(textarea.style.height).toBe('72px');
    });

    it('only measures when the width changes', async () => {
      const { textarea, setScrollHeight } = await setup();
      await vi.waitFor(() => expect(resizeCallback).toBeDefined());
      resize(480);

      setScrollHeight(200);
      resize(480);
      expect(textarea.style.height).toBe('72px');

      resize(320);
      expect(textarea.style.height).toBe('200px');
    });

    it('grows while typing and when the form writes a longer value', async () => {
      const { control, textarea, setScrollHeight } = await setup();

      setScrollHeight(96);
      await userEvent.type(textarea, 'More');
      expect(textarea.style.height).toBe('96px');

      setScrollHeight(144);
      control.setValue('A much longer description');
      await vi.waitFor(() => expect(textarea.style.height).toBe('144px'));
    });
  });
});
