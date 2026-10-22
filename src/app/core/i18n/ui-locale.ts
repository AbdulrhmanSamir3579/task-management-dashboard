import type { UiLocale } from '../../shared/ui/locale/ui-locale.service';
import type { LanguageService } from './language.service';

/** Weeks start on Monday everywhere in the app, as in the calendar views. */
const FIRST_DAY_OF_WEEK = 1;

const names = (
  locale: string,
  count: number,
  date: (index: number) => Date,
  options: Intl.DateTimeFormatOptions,
) => {
  const format = new Intl.DateTimeFormat(locale, options);
  return Array.from({ length: count }, (_, index) => format.format(date(index)));
};

// 2024-01-07 was a Sunday.
const sunday = (index: number) => new Date(2024, 0, 7 + index);
const january = (index: number) => new Date(2024, index, 1);

/** The UI library's texts in the current language: names from `Intl`, the rest translated. */
export function uiLocaleFor(language: LanguageService): UiLocale {
  const locale = language.locale();
  return {
    dayNames: names(locale, 7, sunday, { weekday: 'long' }),
    dayNamesShort: names(locale, 7, sunday, { weekday: 'short' }),
    dayNamesMin: names(locale, 7, sunday, { weekday: 'narrow' }),
    monthNames: names(locale, 12, january, { month: 'long' }),
    monthNamesShort: names(locale, 12, january, { month: 'short' }),
    firstDayOfWeek: FIRST_DAY_OF_WEEK,
    today: language.t('UI.TODAY'),
    clear: language.t('UI.CLEAR'),
    noResults: language.t('UI.NO_RESULTS'),
    previousMonth: language.t('UI.PREVIOUS_MONTH'),
    nextMonth: language.t('UI.NEXT_MONTH'),
    previousYear: language.t('UI.PREVIOUS_YEAR'),
    nextYear: language.t('UI.NEXT_YEAR'),
    previousDecade: language.t('UI.PREVIOUS_DECADE'),
    nextDecade: language.t('UI.NEXT_DECADE'),
    chooseDate: language.t('UI.CHOOSE_DATE'),
    close: language.t('COMMON.CLOSE'),
  };
}
