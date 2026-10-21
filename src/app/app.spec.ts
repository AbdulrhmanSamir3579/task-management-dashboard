import { ChangeDetectionStrategy, Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { App } from './app';

@Component({
  template: '<h1>Stub page</h1>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StubPage {}

describe('App', () => {
  it('renders the active route inside the root component', async () => {
    const { navigate } = await render(App, {
      routes: [{ path: '', component: StubPage }],
    });

    await navigate('/');

    expect(await screen.findByRole('heading', { name: 'Stub page' })).toBeInTheDocument();
  });
});
