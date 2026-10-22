import { DOCUMENT, Injectable, computed, effect, inject } from '@angular/core';
import { type InterpolationParameters, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { BrowserStorage } from '../storage/browser-storage';
import { DEFAULT_LANGUAGE, LANGUAGES, type Language, isLanguage } from './languages';
import type { TranslationKey } from './translation-key';

/** Also read by the inline script in index.html, which sets the direction before start-up. */
export const LANGUAGE_STORAGE_KEY = 'task-manager.language';

/**
 * The language of the app. Switching waits for the new strings to load, then updates
 * every translation, `<html lang dir>` and the saved choice at once.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly storage = inject(BrowserStorage);
  private readonly document = inject(DOCUMENT);

  /** Changes only once the new language's strings have loaded. */
  readonly language = computed<Language>(() => {
    const current = this.translate.currentLang();
    return isLanguage(current) ? current : DEFAULT_LANGUAGE;
  });
  readonly direction = computed(() => LANGUAGES[this.language()].direction);
  /** For `Intl` formatting of dates, times and numbers. */
  readonly locale = computed(() => LANGUAGES[this.language()].locale);

  constructor() {
    effect(() => {
      const root = this.document.documentElement;
      root.lang = this.language();
      root.dir = this.direction();
    });
  }

  /** Loads the saved language; the app starts once its strings are ready. */
  start(): Promise<void> {
    const saved = this.storage.get(LANGUAGE_STORAGE_KEY);
    return this.use(isLanguage(saved) ? saved : DEFAULT_LANGUAGE);
  }

  async use(language: Language): Promise<void> {
    await firstValueFrom(this.translate.use(language));
    this.storage.set(LANGUAGE_STORAGE_KEY, language);
  }

  /**
   * A string in the current language. Read inside `computed()` or a template, it
   * updates when the language changes, unlike a bare `instant()`.
   */
  t(key: TranslationKey, params?: InterpolationParameters): string {
    this.language();
    return this.translate.instant(key, params) as string;
  }
}
