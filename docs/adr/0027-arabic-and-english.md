# 0027. Arabic and English

- Status: Accepted
- Date: 2026-10-22

## Context

The assignment lists internationalisation as a bonus. The team's other Angular projects use ngx-translate for English and Arabic. A review of how they use it found problems to avoid: polling until translations load, `instant()` strings that go stale after a language switch, no plural handling, no safety net for missing keys, mixed physical and logical CSS for right-to-left, and dates and numbers locked to `en-US`.

## Decision

- **ngx-translate 18**, set up with the standalone `provideTranslateService` API, so the library matches the other projects.
- **Catalogues as code-split modules**: `src/app/core/i18n/translations/{en,ar}.json` load through `import()` (`ImportTranslateLoader`), not over HTTP. Each language is its own cached chunk; the requests skip the API interceptors and the in-browser mock backend, and they work under any base path.
- **Typed keys**: `TranslationKey` is derived from `en.json`, so a wrong key in TypeScript fails to compile. Keys used in templates are checked by `npm run i18n:check` in CI, which also fails on text written into a template instead of a translation.
- **No flash and no polling**:
  - an app initializer waits for the saved language's strings before the first render;
  - the inline script in `index.html` sets `lang` and `dir` before Angular starts, so a reload in Arabic does not flip from left to right.
- **`LanguageService`** keeps the language, direction and `Intl` locale as signals. It sets `<html lang dir>` and stores the choice. Its `t()` reads the language signal, so text built inside `computed()` (menu items, chart labels, options) is rebuilt on a switch. Toasts and confirmations are translated when they are shown.
- **Plurals**: `plural()` and the `plural` pipe pick the form with `Intl.PluralRules`. English stores `one` and `other`; Arabic stores all six forms (zero, one, two, few, many, other), so "2 days" reads "يومين", not a number and a plural noun. Counted validation messages are worded in Arabic to avoid noun agreement ("الحد الأقصى: 5").
- **Pure functions stay language-free**: they return a `TextRef` (a key with its parameters, or a plural key with a count) or take a `Translate` function, and the component renders the text.
- **Activity sentences** are whole templates with `{{actor}}`, `{{title}}` and `{{status}}`, so each language uses its own word order. The list splits the translated sentence at those slots to keep the person and task in bold. Your own changes have their own templates.
- **Errors**:
  - validators return `{ key, params }`, which `ui-form-field` translates;
  - the error interceptor translates API error messages;
  - every request carries `Accept-Language`, and the mock server answers its own messages in that language, as a real backend would.
- **UI library texts** (date picker month and day names, Today, Clear, its navigation labels, "No results") go to PrimeNG through `UiLocaleService` in `shared/ui`. Names come from `Intl`, and weeks start on Monday as in the calendar.
- **Dates and numbers** use `Intl` with the current locale everywhere. For Arabic that is `ar-u-nu-latn`, which keeps Western digits like the rest of the data. `DatePipe` stays unused ([0019](0019-activity-feed.md)).
- **Right to left**:
  - the app's CSS uses logical properties;
  - the mobile drawer and the toasts are mirrored with `:dir(rtl)`;
  - charts are always drawn left to right, because ECharts anchors its SVG text and a right-to-left page would flip it, and are mirrored through their options instead: legends from the right, category axes starting on the right, horizontal bars growing to the left, value axes on the right;
  - IBM Plex Sans Arabic follows Inter in the font stack, and its `unicode-range` means it downloads only when Arabic text is shown.
- **Switching**: a button in the header shows the other language in its own name ("العربية" / "English"), and Settings has a Language card. Language names are never translated.
- **Not translated**: task titles, descriptions, tags and people's names, which are data, and the English fallbacks used where translations are not available (outside dependency injection).
- **Tests**:
  - every test gets the real English catalogue through the test builder's `providersFile`, so tests read like the screen;
  - `provideArabicForTesting()` renders components in Arabic for right-to-left tests;
  - specs check that both files have the same keys, every plural form each language needs, no empty strings and the same placeholders;
  - a global `afterEach` resets saved preferences and the page direction, so tests do not leak a language into each other.

## Consequences

- Adding a language takes a JSON file, an entry in `LANGUAGES` and the plural forms that language needs; the checks list anything missing.
- ngx-translate and the i18n code add about 20 kB to the initial bundle. The strings load per language on demand.
- Keys in templates are strings to the compiler; the CI check covers them, but only for literal keys.
