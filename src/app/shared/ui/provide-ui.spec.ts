import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNG } from 'primeng/config';
import { DARK_MODE_CLASS, provideUi } from './provide-ui';
import { AppPreset } from './theme/app-preset';

describe('provideUi', () => {
  it('configures PrimeNG with the app preset, dark mode class and CSS layer', () => {
    TestBed.configureTestingModule({ providers: [provideUi()] });

    expect(TestBed.inject(PrimeNG).theme()).toEqual({
      preset: AppPreset,
      options: { darkModeSelector: `.${DARK_MODE_CLASS}`, cssLayer: true },
    });
  });
});

describe('provideUi services', () => {
  it('registers the services behind notifications and confirmations', () => {
    TestBed.configureTestingModule({ providers: [provideUi()] });

    expect(TestBed.inject(MessageService)).toBeInstanceOf(MessageService);
    expect(TestBed.inject(ConfirmationService)).toBeInstanceOf(ConfirmationService);
  });
});

describe('AppPreset', () => {
  it('maps every primary shade to the blue palette', () => {
    const primary = (AppPreset as { semantic: { primary: Record<string, string> } }).semantic
      .primary;

    expect(primary['50']).toBe('{blue.50}');
    expect(primary['500']).toBe('{blue.500}');
    expect(primary['950']).toBe('{blue.950}');
  });
});
