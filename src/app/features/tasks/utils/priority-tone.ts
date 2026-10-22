import type { TaskPriority } from '../../../core/models';
import type { Tone } from '../../../shared/ui/ui.types';

/** Tag colour of each priority: red, orange, green. */
export const PRIORITY_TONES: Readonly<Record<TaskPriority, Tone>> = {
  high: 'danger',
  medium: 'warning',
  low: 'success',
};
