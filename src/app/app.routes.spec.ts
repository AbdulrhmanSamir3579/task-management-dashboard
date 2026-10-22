import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, TitleStrategy } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { App } from './app';
import { routes } from './app.routes';
import { AppTitleStrategy } from './core/layout/app-title.strategy';
import { provideUi } from './shared/ui/provide-ui';

describe('app routes', () => {
  async function visit(url: string) {
    const { navigate } = await render(App, {
      routes,
      providers: [
        provideUi(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TitleStrategy, useClass: AppTitleStrategy },
      ],
    });
    await navigate(url);
  }

  it('opens the dashboard by default', async () => {
    await visit('/');

    expect(TestBed.inject(Router).url).toBe('/dashboard');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
  });

  it('lazy loads the Analytics page and sets the tab title', async () => {
    await visit('/analytics');

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Tasks by status' }),
    ).toBeInTheDocument();
    expect(TestBed.inject(Title).getTitle()).toBe('Analytics · Task Manager');
  });

  it('lazy loads the Team page and sets the tab title', async () => {
    await visit('/team');

    expect(await screen.findByRole('status', { name: 'Loading the team' })).toBeInTheDocument();
    expect(TestBed.inject(Title).getTitle()).toBe('Team · Task Manager');
  });

  it('lazy loads the Calendar page and sets the tab title', async () => {
    await visit('/calendar');

    expect(await screen.findByRole('status', { name: 'Loading the calendar' })).toBeInTheDocument();
    expect(TestBed.inject(Title).getTitle()).toBe('Calendar · Task Manager');
  });

  it('lazy loads the Settings page and sets the tab title', async () => {
    await visit('/settings');

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Appearance' }),
    ).toBeInTheDocument();
    expect(TestBed.inject(Title).getTitle()).toBe('Settings · Task Manager');
  });

  it('shows a not found page with a way back for unknown urls', async () => {
    await visit('/does-not-exist');

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(TestBed.inject(Title).getTitle()).toBe('Page not found · Task Manager');
  });
});
