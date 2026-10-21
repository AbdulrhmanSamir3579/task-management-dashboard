import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNG } from 'primeng/config';
import { DARK_MODE_CLASS, provideUi } from './provide-ui';
import { AppPreset, BRAND_BLUE } from './theme/app-preset';

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
  it('uses the design primary colour as the 500 shade', () => {
    const { primary } = (AppPreset as { semantic: { primary: Record<string, string> } }).semantic;

    expect(primary['500']).toBe('#1976d2');
    expect(primary).toMatchObject(BRAND_BLUE);
  });
});
