import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import en from '../app/core/i18n/translations/en.json';

/**
 * Added to every test (angular.json `providersFile`): the real English strings, loaded
 * synchronously, so tests read like the screen instead of showing translation keys.
 */
export default [
  provideTranslateService({
    lang: 'en',
    fallbackLang: 'en',
    loader: () => ({ getTranslation: () => of(en) }),
  }),
];
