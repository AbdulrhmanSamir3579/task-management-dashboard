import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { UiTooltip } from './tooltip';

describe('UiTooltip', () => {
  it('shows its text while the element is hovered', async () => {
    await render(
      `<button type="button" uiTooltip="Edit task" uiTooltipPosition="top">Edit</button>`,
      {
        imports: [UiTooltip],
      },
    );

    await userEvent.hover(screen.getByRole('button', { name: 'Edit' }));

    expect(await screen.findByText('Edit task')).toBeInTheDocument();
  });
});
