import { TestBed } from '@angular/core/testing';
import { BrowserStorage } from './browser-storage';

describe('BrowserStorage', () => {
  const storage = () => TestBed.inject(BrowserStorage);

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores and reads values', () => {
    storage().set('key', 'value');

    expect(storage().get('key')).toBe('value');
    expect(storage().get('missing')).toBeNull();
  });

  it('keeps working when the browser refuses storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });

    expect(() => storage().set('key', 'value')).not.toThrow();
    expect(storage().get('key')).toBeNull();
  });
});
