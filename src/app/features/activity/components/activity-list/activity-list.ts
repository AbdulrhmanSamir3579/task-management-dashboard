import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { type Activity, CURRENT_USER_ACTOR } from '../../../../core/models';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import { describeActivity } from './describe-activity';

/** Recent changes, newest first; entries by others since `newSince` are marked as new. */
@Component({
  selector: 'app-activity-list',
  imports: [DatePipe, RelativeTimePipe],
  templateUrl: './activity-list.html',
  styleUrl: './activity-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityList {
  readonly activities = input.required<Activity[]>();
  /** Reference time for "5 minutes ago". */
  readonly now = input.required<Date>();
  /** `null` marks every entry by others as new. */
  readonly newSince = input<string | null>(null);

  protected readonly entries = computed(() => {
    const since = this.newSince();
    return this.activities().map((activity) => ({
      ...activity,
      ...describeActivity(activity),
      isNew:
        activity.actor !== CURRENT_USER_ACTOR && (since === null || activity.timestamp > since),
    }));
  });
}
