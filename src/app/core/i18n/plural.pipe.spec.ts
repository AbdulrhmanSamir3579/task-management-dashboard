import { render, screen } from '@testing-library/angular';
import { PluralPipe } from './plural.pipe';

describe('PluralPipe', () => {
  it('shows the plural form for the count', async () => {
    await render(`<p>{{ 'COMMON.DAYS' | plural: 1 }}, {{ 'COMMON.DAYS' | plural: 4 }}</p>`, {
      imports: [PluralPipe],
    });

    expect(screen.getByText('1 day, 4 days')).toBeInTheDocument();
  });
});
