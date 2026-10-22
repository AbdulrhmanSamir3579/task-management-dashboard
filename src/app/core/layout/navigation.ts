import type { TranslationKey } from '../i18n/translation-key';

export interface NavItem {
  label: TranslationKey;
  path: string;
  /** Emoji shown before the label; hidden from screen readers. */
  icon: string;
}

export const NAVIGATION: readonly NavItem[] = [
  { label: 'NAV.DASHBOARD', path: '/dashboard', icon: '📊' },
  { label: 'NAV.TASKS', path: '/tasks', icon: '✅' },
  { label: 'NAV.CALENDAR', path: '/calendar', icon: '📅' },
  { label: 'NAV.ANALYTICS', path: '/analytics', icon: '📈' },
  { label: 'NAV.TEAM', path: '/team', icon: '👥' },
  { label: 'NAV.SETTINGS', path: '/settings', icon: '⚙️' },
];
