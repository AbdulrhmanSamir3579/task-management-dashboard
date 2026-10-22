import type { InterpolationParameters } from '@ngx-translate/core';
import type { PluralKey, TranslationKey } from './translation-key';

/**
 * Text that pure functions return instead of a finished string, so they stay free of
 * the current language: a key with its parameters, or a counted key with its count.
 * `LanguageService.text()` and the `text` pipe turn it into a string.
 */
export type TextRef =
  | { key: TranslationKey; params?: InterpolationParameters }
  | { plural: PluralKey; count: number; params?: InterpolationParameters };
