import type en from './translations/en.json';

/** Dot paths to the strings of a translation file, e.g. `'COMMON.CANCEL'`. */
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Every key in the English file; a typo in TypeScript code is a compile error. */
export type TranslationKey = Leaves<typeof en>;
