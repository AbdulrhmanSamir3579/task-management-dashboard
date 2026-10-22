import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TASK_STATUSES, TASK_STATUS_KEYS, type TaskStatus } from '../../../../core/models';

/** Status tabs above the board, plus a slot on the right for actions. */
@Component({
  selector: 'app-board-toolbar',
  imports: [TranslatePipe],
  templateUrl: './board-toolbar.html',
  styleUrl: './board-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardToolbar {
  /** Selected status; `null` shows every column. */
  readonly status = input<TaskStatus | null>(null);
  readonly statusChange = output<TaskStatus | null>();

  protected readonly statuses = TASK_STATUSES;
  protected readonly labels = TASK_STATUS_KEYS;
}
