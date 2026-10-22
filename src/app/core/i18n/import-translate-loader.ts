import { Injectable } from '@angular/core';
import type { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { type Observable, from, map } from 'rxjs';
import { DEFAULT_LANGUAGE, type Language, isLanguage } from './languages';

const CATALOGUES: Readonly<Record<Language, () => Promise<{ default: TranslationObject }>>> = {
  en: () => import('./translations/en.json'),
  ar: () => import('./translations/ar.json'),
};

/**
 * Loads a language's strings as a code-split module instead of over HTTP: each language
 * is its own cached chunk, nothing passes through the API interceptors or the mock
 * backend, and it works under any base path.
 */
@Injectable()
export class ImportTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    const load = CATALOGUES[isLanguage(lang) ? lang : DEFAULT_LANGUAGE];
    return from(load()).pipe(map((module) => module.default));
  }
}
