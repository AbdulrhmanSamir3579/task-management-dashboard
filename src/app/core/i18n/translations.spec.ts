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

describe('translations', () => {
  const english = leaves(en);
  const arabic = leaves(ar);

  it('has the same keys in English and Arabic', () => {
    expect([...arabic.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it('has no empty strings', () => {
    const empty = [...english, ...arabic].filter(([, text]) => !text.trim()).map(([key]) => key);
    expect(empty).toEqual([]);
  });

  it('uses the same placeholders in both languages', () => {
    const mismatched = [...english]
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
