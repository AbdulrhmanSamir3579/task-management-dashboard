import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import ar from '../app/core/i18n/translations/ar.json';
import en from '../app/core/i18n/translations/en.json';

/** The real catalogues, loaded synchronously, starting in Arabic; for right-to-left tests. */
export function provideArabicForTesting() {
  return provideTranslateService({
    lang: 'ar',
    fallbackLang: 'en',
    loader: () => ({ getTranslation: (lang: string) => of(lang === 'ar' ? ar : en) }),
  });
}
