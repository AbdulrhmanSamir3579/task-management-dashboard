import { Injectable, inject } from '@angular/core';
import { PrimeNG } from 'primeng/config';

/** Texts the UI library shows by itself: date picker names and buttons, empty lists. */
export interface UiLocale {
  /** Seven names each, starting on Sunday. */
  dayNames: string[];
  dayNamesShort: string[];
  dayNamesMin: string[];
  /** Twelve names each, starting in January. */
  monthNames: string[];
  monthNamesShort: string[];
  /** 0 is Sunday. */
  firstDayOfWeek: number;
  today: string;
  clear: string;
  noResults: string;
  previousMonth: string;
  nextMonth: string;
  previousYear: string;
  nextYear: string;
  previousDecade: string;
  nextDecade: string;
  chooseDate: string;
  close: string;
}

/** Applies a `UiLocale` to PrimeNG, so features never touch its translation API. */
@Injectable({ providedIn: 'root' })
export class UiLocaleService {
  private readonly primeng = inject(PrimeNG);

  apply(locale: UiLocale): void {
    this.primeng.setTranslation({
      dayNames: locale.dayNames,
      dayNamesShort: locale.dayNamesShort,
      dayNamesMin: locale.dayNamesMin,
      monthNames: locale.monthNames,
      monthNamesShort: locale.monthNamesShort,
      firstDayOfWeek: locale.firstDayOfWeek,
      today: locale.today,
      clear: locale.clear,
      emptyMessage: locale.noResults,
      emptySearchMessage: locale.noResults,
      emptyFilterMessage: locale.noResults,
      // The date picker reads its button labels from the top level, not from `aria`.
      prevMonth: locale.previousMonth,
      nextMonth: locale.nextMonth,
      prevYear: locale.previousYear,
      nextYear: locale.nextYear,
      prevDecade: locale.previousDecade,
      nextDecade: locale.nextDecade,
      chooseDate: locale.chooseDate,
      aria: { close: locale.close },
    });
  }
}
