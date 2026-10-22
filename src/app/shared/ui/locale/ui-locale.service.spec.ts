import { TestBed } from '@angular/core/testing';
import { PrimeNG } from 'primeng/config';
import { provideUi } from '../provide-ui';
import { type UiLocale, UiLocaleService } from './ui-locale.service';

const locale: UiLocale = {
  dayNames: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  dayNamesShort: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  dayNamesMin: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
  monthNames: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ],
  monthNamesShort: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ],
  firstDayOfWeek: 1,
  today: 'اليوم',
  clear: 'مسح',
  noResults: 'لا توجد نتائج',
  previousMonth: 'الشهر السابق',
  nextMonth: 'الشهر التالي',
  previousYear: 'السنة السابقة',
  nextYear: 'السنة التالية',
  previousDecade: 'العقد السابق',
  nextDecade: 'العقد التالي',
  chooseDate: 'اختر التاريخ',
  close: 'إغلاق',
};

describe('UiLocaleService', () => {
  it('passes the texts to PrimeNG under the names its components read', () => {
    TestBed.configureTestingModule({ providers: [provideUi()] });

    TestBed.inject(UiLocaleService).apply(locale);

    const primeng = TestBed.inject(PrimeNG);
    expect(primeng.getTranslation('monthNames')[9]).toBe('أكتوبر');
    expect(primeng.getTranslation('today')).toBe('اليوم');
    expect(primeng.getTranslation('emptyMessage')).toBe('لا توجد نتائج');
    expect(primeng.getTranslation('prevMonth')).toBe('الشهر السابق');
    expect(primeng.getTranslation('chooseDate')).toBe('اختر التاريخ');
    expect(primeng.getTranslation('firstDayOfWeek')).toBe(1);
  });
});
