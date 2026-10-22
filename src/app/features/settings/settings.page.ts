import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { type ThemePreference, ThemeService } from '../../core/theme/theme.service';

interface ThemeOption {
  value: ThemePreference;
  label: string;
  icon: string;
  hint: string;
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'light', label: 'Light', icon: '☀️', hint: 'Bright, as in the design' },
  { value: 'dark', label: 'Dark', icon: '🌙', hint: 'Easier on the eyes at night' },
  { value: 'system', label: 'System', icon: '💻', hint: 'Follows your device' },
];

/** Appearance and notes about the demo data. */
@Component({
  selector: 'app-settings-page',
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  protected readonly theme = inject(ThemeService);
  protected readonly options = THEME_OPTIONS;
}
