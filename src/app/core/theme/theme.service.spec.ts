import { TestBed } from '@angular/core/testing';
import { DARK_MODE_CLASS } from '../../shared/ui/provide-ui';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  let systemListener: ((event: MediaQueryListEvent) => void) | undefined;

  function mockSystemTheme(dark: boolean) {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: dark,
      addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
        systemListener = listener;
      },
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
  }

  function createService() {
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    return service;
  }

  const isDarkOnPage = () => document.documentElement.classList.contains(DARK_MODE_CLASS);

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(DARK_MODE_CLASS);
    systemListener = undefined;
    vi.restoreAllMocks();
  });

  it('starts light, as in the design', () => {
    mockSystemTheme(true);

    const service = createService();

    expect(service.preference()).toBe('light');
    expect(isDarkOnPage()).toBe(false);
  });

  it('switches the page to dark and remembers the choice', () => {
    mockSystemTheme(false);
    const service = createService();

    service.setPreference('dark');
    TestBed.tick();

    expect(isDarkOnPage()).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('uses a stored choice and ignores unknown values', () => {
    mockSystemTheme(false);
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(createService().isDark()).toBe(true);

    TestBed.resetTestingModule();
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(createService().preference()).toBe('light');
  });

  it('follows the device when set to system, also when the device changes', () => {
    mockSystemTheme(true);
    const service = createService();

    service.setPreference('system');
    TestBed.tick();
    expect(isDarkOnPage()).toBe(true);

    systemListener?.({ matches: false } as MediaQueryListEvent);
    TestBed.tick();
    expect(isDarkOnPage()).toBe(false);
  });
});
