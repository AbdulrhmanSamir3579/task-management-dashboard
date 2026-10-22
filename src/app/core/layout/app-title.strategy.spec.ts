import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import type { RouterStateSnapshot } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { LanguageService } from '../i18n/language.service';
import { AppTitleStrategy } from './app-title.strategy';

describe('AppTitleStrategy', () => {
  it('falls back to the app name when the route has no title', () => {
    const strategy = TestBed.inject(AppTitleStrategy);
    vi.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);

    strategy.updateTitle({} as RouterStateSnapshot);

    expect(TestBed.inject(Title).getTitle()).toBe('Task Manager');
  });

  it('translates the route title and follows language changes', async () => {
    const strings: Record<string, object> = {
      en: { APP: { NAME: 'Task Manager' }, NAV: { TASKS: 'Tasks' } },
      ar: { APP: { NAME: 'مدير المهام' }, NAV: { TASKS: 'المهام' } },
    };
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          lang: 'en',
          loader: () => ({ getTranslation: (lang: string) => of(strings[lang]!) }),
        }),
      ],
    });
    const strategy = TestBed.inject(AppTitleStrategy);
    vi.spyOn(strategy, 'buildTitle').mockReturnValue('NAV.TASKS');

    strategy.updateTitle({} as RouterStateSnapshot);
    expect(TestBed.inject(Title).getTitle()).toBe('Tasks · Task Manager');

    await TestBed.inject(LanguageService).use('ar');
    TestBed.tick();
    expect(TestBed.inject(Title).getTitle()).toBe('المهام · مدير المهام');
  });
});
