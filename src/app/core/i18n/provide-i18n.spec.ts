import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';
import { ReportingMissingTranslationHandler, provideI18n } from './provide-i18n';

describe('provideI18n', () => {
  it('starts the app only once the saved language has loaded', async () => {
    TestBed.configureTestingModule({ providers: [provideI18n()] });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(TestBed.inject(LanguageService).language()).toBe('en');
    expect(TestBed.inject(TranslateService).instant('COMMON.CANCEL')).toBe('Cancel');
  });

  it('shows the key of a missing string and reports it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const text = new ReportingMissingTranslationHandler().handle({
      key: 'NOPE.MISSING',
      translateService: {} as TranslateService,
    });

    expect(text).toBe('NOPE.MISSING');
    expect(warn).toHaveBeenCalledWith('Missing translation: NOPE.MISSING');
    warn.mockRestore();
  });
});
