import {
  type EnvironmentProviders,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import {
  type MissingTranslationHandler,
  type MissingTranslationHandlerParams,
  provideTranslateService,
} from '@ngx-translate/core';
import { ImportTranslateLoader } from './import-translate-loader';
import { LanguageService } from './language.service';
import { DEFAULT_LANGUAGE } from './languages';

/** Shows the key, and in development says which one is missing. */
export class ReportingMissingTranslationHandler implements MissingTranslationHandler {
  handle({ key }: MissingTranslationHandlerParams): string {
    if (isDevMode()) {
      console.warn(`Missing translation: ${key}`);
    }
    return key;
  }
}

/** ngx-translate with code-split catalogues; the app renders once the saved language is ready. */
export function provideI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTranslateService({
      fallbackLang: DEFAULT_LANGUAGE,
      loader: ImportTranslateLoader,
      missingTranslationHandler: ReportingMissingTranslationHandler,
    }),
    provideAppInitializer(() => inject(LanguageService).start()),
  ]);
}
