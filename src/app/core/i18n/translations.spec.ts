import { firstValueFrom } from 'rxjs';
import { ImportTranslateLoader } from './import-translate-loader';
import ar from './translations/ar.json';
import en from './translations/en.json';

interface Catalogue {
  [key: string]: string | Catalogue;
}

function leaves(catalogue: Catalogue, prefix = ''): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(catalogue)) {
    if (typeof value === 'string') {
      result.set(`${prefix}${key}`, value);
    } else {
      for (const [path, text] of leaves(value, `${prefix}${key}.`)) {
        result.set(path, text);
      }
    }
  }
  return result;
}

const placeholders = (text: string) =>
  [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();

/** Plural forms a language needs, e.g. `one` and `other` for English. */
const pluralForms = (language: string) =>
  new Intl.PluralRules(language).resolvedOptions().pluralCategories.slice().sort();

const PLURAL_FORM = /\.(zero|one|two|few|many|other)$/;

/** Keys with plural forms folded into their base key, e.g. `COMMON.DAYS`. */
const baseKeys = (keys: Iterable<string>) =>
  [...new Set([...keys].map((key) => key.replace(PLURAL_FORM, '')))].sort();

describe('translations', () => {
  const english = leaves(en);
  const arabic = leaves(ar);

  it('has the same keys in English and Arabic', () => {
    expect(baseKeys(arabic.keys())).toEqual(baseKeys(english.keys()));
  });

  it('has every plural form each language needs', () => {
    for (const [language, catalogue] of [
      ['en', english],
      ['ar', arabic],
    ] as const) {
      const plurals = baseKeys([...catalogue.keys()].filter((key) => PLURAL_FORM.test(key)));
      for (const key of plurals) {
        const forms = [...catalogue.keys()]
          .filter((k) => k.startsWith(`${key}.`) && PLURAL_FORM.test(k))
          .map((k) => k.slice(key.length + 1))
          .sort();
        expect({ key, language, forms }).toEqual({ key, language, forms: pluralForms(language) });
      }
    }
  });

  it('has no empty strings', () => {
    const empty = [...english, ...arabic].filter(([, text]) => !text.trim()).map(([key]) => key);
    expect(empty).toEqual([]);
  });

  it('uses the same placeholders in both languages', () => {
    const mismatched = [...english]
      .filter(([key]) => !PLURAL_FORM.test(key))
      .filter(
        ([key, text]) => placeholders(text).join() !== placeholders(arabic.get(key) ?? '').join(),
      )
      .map(([key]) => key);
    expect(mismatched).toEqual([]);
  });

  it('loads each language as its own module, with English for unknown ones', async () => {
    const loader = new ImportTranslateLoader();

    expect(await firstValueFrom(loader.getTranslation('ar'))).toEqual(ar);
    expect(await firstValueFrom(loader.getTranslation('en'))).toEqual(en);
    expect(await firstValueFrom(loader.getTranslation('fr'))).toEqual(en);
  });
});
