import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { IdlePreloadingStrategy, PRELOAD_IDLE_TIMEOUT_MS } from './idle-preloading.strategy';

describe('IdlePreloadingStrategy', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('loads pages once the browser is idle', () => {
    let idle: (() => void) | undefined;
    vi.stubGlobal('requestIdleCallback', (callback: () => void) => {
      idle = callback;
      return 1;
    });
    vi.stubGlobal('cancelIdleCallback', vi.fn());
    const strategy = TestBed.inject(IdlePreloadingStrategy);
    const load = vi.fn(() => of('page'));
    const loaded = vi.fn();

    strategy.preload({}, load).subscribe(loaded);
    strategy.preload({}, load).subscribe(loaded);
    expect(load).not.toHaveBeenCalled();

    idle?.();

    expect(load).toHaveBeenCalledTimes(2);
    expect(loaded).toHaveBeenCalledWith('page');
  });

  it('falls back to a timer where idle callbacks are missing', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    const strategy = TestBed.inject(IdlePreloadingStrategy);
    const load = vi.fn(() => of('page'));

    strategy.preload({}, load).subscribe();
    vi.advanceTimersByTime(PRELOAD_IDLE_TIMEOUT_MS / 2 - 1);
    expect(load).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(load).toHaveBeenCalledTimes(1);
  });
});
