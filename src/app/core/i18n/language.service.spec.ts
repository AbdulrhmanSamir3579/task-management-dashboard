import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { LANGUAGE_STORAGE_KEY, LanguageService } from './language.service';

const strings = {
  en: { COMMON: { CANCEL: 'Cancel' } },
  ar: { COMMON: { CANCEL: 'إلغاء' } },
};

describe('LanguageService', () => {
  function createService() {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          fallbackLang: 'en',
          loader: () => ({ getTranslation: (lang: string) => of(strings[lang as 'en' | 'ar']) }),
        }),
      ],
    });
    return TestBed.inject(LanguageService);
  }

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('dir');
    document.documentElement.lang = 'en';
  });

  it('starts in English with left-to-right layout', async () => {
    const service = createService();

    await service.start();
    TestBed.tick();

    expect(service.language()).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(service.t('COMMON.CANCEL')).toBe('Cancel');
  });

  it('switches to Arabic, right to left, and remembers it', async () => {
    const service = createService();
    await service.start();

    await service.use('ar');
    TestBed.tick();

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(service.locale()).toBe('ar-u-nu-latn');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ar');
  });

  it('starts in the saved language and ignores unknown values', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ar');
    let service = createService();
    await service.start();
    expect(service.language()).toBe('ar');

    TestBed.resetTestingModule();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
    service = createService();
    await service.start();
    expect(service.language()).toBe('en');
  });

  it('updates translations read in computed() when the language changes', async () => {
    const service = createService();
    await service.start();
    const label = TestBed.runInInjectionContext(() => computed(() => service.t('COMMON.CANCEL')));
    expect(label()).toBe('Cancel');

    await service.use('ar');

    expect(label()).toBe('إلغاء');
  });
});
