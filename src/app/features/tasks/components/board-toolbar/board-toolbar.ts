import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskStatus } from '../../../../core/models';

/** Status tabs above the board, plus a slot on the right for actions. */
@Component({
  selector: 'app-board-toolbar',
  template: `
    <div class="toolbar">
      <div class="toolbar__tabs" role="group" aria-label="Show tasks by status">
        <button
          type="button"
          class="tab"
          [class.tab--active]="status() === null"
          [attr.aria-pressed]="status() === null"
          (click)="statusChange.emit(null)"
        >
          All
        </button>
        @for (option of statuses; track option) {
          <button
            type="button"
            class="tab"
            [class.tab--active]="status() === option"
            [attr.aria-pressed]="status() === option"
            (click)="statusChange.emit(option)"
          >
            {{ labels[option] }}
          </button>
        }
      </div>
      <div class="toolbar__actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 1rem 1rem 0.5rem;
      border-radius: var(--app-radius-md);
      background: var(--app-surface);
      box-shadow: var(--app-shadow-sm);
    }
    .toolbar__tabs,
    .toolbar__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }
    .tab {
      padding: 0.5rem 1rem;
      border: 0;
      border-radius: var(--app-radius-sm);
      background: none;
      color: var(--app-text);
      font: inherit;
      font-size: 0.83125rem;
      line-height: 1rem;
      cursor: pointer;

      &:hover {
        background: var(--app-background);
      }

      &:focus-visible {
        outline: 2px solid var(--app-primary);
        outline-offset: 2px;
      }
    }
    .tab--active,
    .tab--active:hover {
      background: var(--app-primary);
      color: var(--app-primary-contrast);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardToolbar {
  /** Selected status; `null` shows every column. */
  readonly status = input<TaskStatus | null>(null);
  readonly statusChange = output<TaskStatus | null>();

  protected readonly statuses = TASK_STATUSES;
  protected readonly labels = TASK_STATUS_LABELS;
}
