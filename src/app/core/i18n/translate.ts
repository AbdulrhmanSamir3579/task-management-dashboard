import type { InterpolationParameters } from '@ngx-translate/core';
import type { TranslationKey } from './translation-key';

/**
 * A translation function passed to pure functions that build text, such as chart data.
 * Components pass `LanguageService.t` from inside `computed()`, so the result follows
 * language changes; tests can pass any function.
 */
export type Translate = (key: TranslationKey, params?: InterpolationParameters) => string;
