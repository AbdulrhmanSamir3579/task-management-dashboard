import { render, screen } from '@testing-library/angular';
import { UiCard } from './card';

describe('UiCard', () => {
  it('renders its title, subtitle and projected content', async () => {
    await render(`<ui-card title="Overview" subtitle="This week"><p>Body</p></ui-card>`, {
      imports: [UiCard],
    });

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });
});
