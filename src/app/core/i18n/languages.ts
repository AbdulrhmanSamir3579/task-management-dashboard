export type Language = 'en' | 'ar';

export interface LanguageInfo {
  code: Language;
  /** Name in the language itself, as language pickers show it. */
  nativeName: string;
  direction: 'ltr' | 'rtl';
  /** Locale for `Intl` formatting. Arabic keeps Western digits, like the rest of the data. */
  locale: string;
}

export const LANGUAGES: Readonly<Record<Language, LanguageInfo>> = {
  en: { code: 'en', nativeName: 'English', direction: 'ltr', locale: 'en' },
  ar: { code: 'ar', nativeName: 'العربية', direction: 'rtl', locale: 'ar-u-nu-latn' },
};

export const DEFAULT_LANGUAGE: Language = 'en';

export function isLanguage(value: string | null | undefined): value is Language {
  return value === 'en' || value === 'ar';
}
