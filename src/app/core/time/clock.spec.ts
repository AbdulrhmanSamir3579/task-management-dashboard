import { TestBed } from '@angular/core/testing';
import { CLOCK } from './clock';

describe('CLOCK', () => {
  it('returns the current time by default', () => {
    const before = Date.now();
    const now = TestBed.inject(CLOCK)().getTime();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});
