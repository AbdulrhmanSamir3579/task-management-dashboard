import {
  type EnvironmentProviders,
  effect,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideAppInitializer,
  provideEnvironmentInitializer,
} from '@angular/core';
import {
  type MissingTranslationHandler,
  type MissingTranslationHandlerParams,
  provideTranslateService,
} from '@ngx-translate/core';
import { UiLocaleService } from '../../shared/ui/locale/ui-locale.service';
import { ImportTranslateLoader } from './import-translate-loader';
import { LanguageService } from './language.service';
import { DEFAULT_LANGUAGE } from './languages';
import { uiLocaleFor } from './ui-locale';

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
    // The UI library's own texts (date picker, empty lists) follow the language too.
    provideEnvironmentInitializer(() => {
      const language = inject(LanguageService);
      const uiLocale = inject(UiLocaleService);
      effect(() => uiLocale.apply(uiLocaleFor(language)));
    }),
  ]);
}
