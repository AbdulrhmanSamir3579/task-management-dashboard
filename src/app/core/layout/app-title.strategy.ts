import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { type RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { LanguageService } from '../i18n/language.service';
import type { TranslationKey } from '../i18n/translation-key';

/**
 * Browser tab title: "Tasks · Task Manager", from the `title` key of the active route,
 * in the current language. It is set again when the language changes.
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly language = inject(LanguageService);
  private readonly pageKey = signal<TranslationKey | null>(null);

  constructor() {
    super();
    effect(() => this.apply());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.pageKey.set((this.buildTitle(snapshot) as TranslationKey | undefined) ?? null);
    this.apply();
  }

  private apply(): void {
    const key = this.pageKey();
    const app = this.language.t('APP.NAME');
    this.title.setTitle(key ? `${this.language.t(key)} · ${app}` : app);
  }
}
