import { Pipe, type PipeTransform } from '@angular/core';
import { formatRelativeTime } from '../utils/relative-time';

/** `{{ activity.timestamp | relativeTime: now : locale }}` gives e.g. "5 minutes ago". */
@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  transform(timestamp: string, now: Date, locale = 'en'): string {
    return formatRelativeTime(timestamp, now, locale);
  }
}
