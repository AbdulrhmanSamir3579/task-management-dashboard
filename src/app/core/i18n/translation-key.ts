import type en from './translations/en.json';

/** Dot paths to the strings of a translation file, e.g. `'COMMON.CANCEL'`. */
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Every key in the English file; a typo in TypeScript code is a compile error. */
export type TranslationKey = Leaves<typeof en>;

/**
 * Keys of counted strings, stored as one string per plural form: English needs `one` and
 * `other`, Arabic `zero`, `one`, `two`, `few`, `many` and `other`.
 */
export type PluralKey = TranslationKey extends infer Key
  ? Key extends `${infer Base}.other`
    ? Base
    : never
  : never;
