/** Public types of the UI wrappers. Features use these, never PrimeNG types. */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type ControlSize = 'small' | 'medium' | 'large';

/** Colour intent of tags and badges. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface SelectOption<T> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface MenuAction {
  label: string;
  command: () => void;
  /** `danger` highlights destructive actions such as deleting. */
  tone?: 'default' | 'danger';
  disabled?: boolean;
}
