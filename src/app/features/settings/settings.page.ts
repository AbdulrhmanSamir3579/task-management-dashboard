import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../core/i18n/language.service';
import { LANGUAGES, type LanguageInfo } from '../../core/i18n/languages';
import type { TranslationKey } from '../../core/i18n/translation-key';
import { type ThemePreference, ThemeService } from '../../core/theme/theme.service';

interface ThemeOption {
  value: ThemePreference;
  label: TranslationKey;
  icon: string;
  hint: TranslationKey;
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'light', label: 'SETTINGS.LIGHT', icon: '☀️', hint: 'SETTINGS.LIGHT_HINT' },
  { value: 'dark', label: 'SETTINGS.DARK', icon: '🌙', hint: 'SETTINGS.DARK_HINT' },
  { value: 'system', label: 'SETTINGS.SYSTEM', icon: '💻', hint: 'SETTINGS.SYSTEM_HINT' },
];

/** Appearance, language, and notes about the demo data. */
@Component({
  selector: 'app-settings-page',
  imports: [TranslatePipe],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  protected readonly theme = inject(ThemeService);
  protected readonly language = inject(LanguageService);
  protected readonly themeOptions = THEME_OPTIONS;
  /** Shown in their own language, as language pickers do. */
  protected readonly languageOptions: readonly LanguageInfo[] = [LANGUAGES.en, LANGUAGES.ar];
}
