export interface NavItem {
  label: string;
  path: string;
  /** Emoji shown before the label; hidden from screen readers. */
  icon: string;
}

export const NAVIGATION: readonly NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Tasks', path: '/tasks', icon: '✅' },
  { label: 'Calendar', path: '/calendar', icon: '📅' },
  { label: 'Analytics', path: '/analytics', icon: '📈' },
  { label: 'Team', path: '/team', icon: '👥' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
];
