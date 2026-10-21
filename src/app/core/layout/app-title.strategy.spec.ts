import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import type { RouterStateSnapshot } from '@angular/router';
import { AppTitleStrategy } from './app-title.strategy';

describe('AppTitleStrategy', () => {
  it('falls back to the app name when the route has no title', () => {
    const strategy = TestBed.inject(AppTitleStrategy);
    vi.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);

    strategy.updateTitle({} as RouterStateSnapshot);

    expect(TestBed.inject(Title).getTitle()).toBe('Task Manager');
  });
});
