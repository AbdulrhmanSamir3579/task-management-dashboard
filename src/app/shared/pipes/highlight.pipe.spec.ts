import { render, screen } from '@testing-library/angular';
import { HighlightPipe } from './highlight.pipe';

describe('HighlightPipe', () => {
  it('lets a template wrap matches in mark elements', async () => {
    await render(
      `<p>@for (part of text | highlight: query; track $index) {@if (part.match) {<mark>{{ part.text }}</mark>} @else {{{ part.text }}}}</p>`,
      {
        imports: [HighlightPipe],
        componentProperties: { text: 'Prepare budget report', query: 'budget' },
      },
    );

    expect(screen.getByText('budget').tagName).toBe('MARK');
    expect(screen.getByRole('paragraph')).toHaveTextContent('Prepare budget report');
  });

  it('handles missing text', () => {
    expect(new HighlightPipe().transform(null, 'x')).toEqual([]);
  });
});
