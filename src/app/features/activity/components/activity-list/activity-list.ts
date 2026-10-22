import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../../core/i18n/language.service';
import { type Activity, CURRENT_USER_ACTOR } from '../../../../core/models';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import { describeActivity } from './describe-activity';

/** A run of a sentence; the actor and the task title are emphasised. */
interface SentencePart {
  text: string;
  strong: boolean;
}

/** Stands in for a value while the sentence is split around it. */
const SLOT = '\u0001';

/** Recent changes, newest first; entries by others since `newSince` are marked as new. */
@Component({
  selector: 'app-activity-list',
  imports: [RelativeTimePipe, TranslatePipe],
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

  protected readonly language = inject(LanguageService);

  protected readonly entries = computed(() => {
    const since = this.newSince();
    const fullDate = new Intl.DateTimeFormat(this.language.locale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return this.activities().map((activity) => {
      const { icon, sentence, status } = describeActivity(activity);
      return {
        ...activity,
        icon,
        parts: this.sentenceParts(activity, sentence, status),
        fullDate: fullDate.format(new Date(activity.timestamp)),
        isNew:
          activity.actor !== CURRENT_USER_ACTOR && (since === null || activity.timestamp > since),
      };
    });
  });

  /**
   * Translates the sentence with markers in place of the actor and title, then splits it
   * there, so they can be emphasised wherever the language puts them.
   */
  private sentenceParts(
    activity: Activity,
    sentence: Parameters<LanguageService['t']>[0],
    status: Parameters<LanguageService['t']>[0] | undefined,
  ): SentencePart[] {
    const text = this.language.t(sentence, {
      actor: `${SLOT}actor${SLOT}`,
      title: `${SLOT}title${SLOT}`,
      status: status ? this.language.t(status) : '',
    });
    return text
      .split(SLOT)
      .map((part, index): SentencePart => {
        // Odd parts are the names of the slots.
        if (index % 2 === 0) {
          return { text: part, strong: false };
        }
        return { text: part === 'actor' ? activity.actor : activity.taskTitle, strong: true };
      })
      .filter((part) => part.text !== '');
  }
}
