import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../../core/i18n/language.service';
import { TextPipe } from '../../../../core/i18n/text.pipe';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_KEYS,
  TASK_STATUSES,
  TASK_STATUS_KEYS,
  type Task,
  type TaskStatus,
  type User,
} from '../../../../core/models';
import { UiAvatar } from '../../../../shared/ui/avatar/avatar';
import { UiFormField } from '../../../../shared/ui/form-field/form-field';
import { UiInputText } from '../../../../shared/ui/input-text/input-text';
import { UiMenu } from '../../../../shared/ui/menu/menu';
import type { MenuAction } from '../../../../shared/ui/ui.types';
import { toIsoDate } from '../../../../shared/utils/date.utils';
import type { TaskChangeState, TaskQuickEdit } from '../../data-access/tasks.store';
import { TITLE_MAX_LENGTH } from '../../task-form/task-limits';
import { notBlank, titleNotTaken } from '../../task-form/task-form.validators';
import { describeDueDate } from '../../utils/due-date';

/**
 * One task on the board. The title, priority and assignee can be changed on the card
 * itself; everything else goes through the task form. Shows the result of a change as a
 * short flash.
 */
@Component({
  selector: 'app-task-card',
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    TextPipe,
    TranslatePipe,
    UiAvatar,
    UiFormField,
    UiInputText,
    UiMenu,
  ],
  host: {
    '[class.task-card--overdue]': 'task().isOverdue',
    '[class.task-card--saving]': "changeState() === 'saving'",
    '[class.task-card--saved]': "changeState() === 'saved'",
    '[class.task-card--failed]': "changeState() === 'failed'",
    '[attr.aria-busy]': "changeState() === 'saving' || null",
  },
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCard {
  readonly task = input.required<Task>();
  readonly changeState = input<TaskChangeState>();
  /** `YYYY-MM-DD` the due date is described against. */
  readonly today = input(toIsoDate(new Date()));
  /** People the task can be given to from the card; without them the assignee is fixed. */
  readonly assignees = input<readonly User[]>([]);
  readonly isTitleTaken = input<(title: string, taskId: string) => boolean>(() => false);
  readonly editRequest = output<void>();
  readonly moveRequest = output<TaskStatus>();
  readonly deleteRequest = output<void>();
  /** A change made on the card itself. */
  readonly quickEdit = output<TaskQuickEdit>();

  private readonly language = inject(LanguageService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly editTitleButton = viewChild<ElementRef<HTMLButtonElement>>('editTitleButton');

  protected readonly titleLimit = TITLE_MAX_LENGTH;
  protected readonly editingTitle = signal(false);
  protected readonly titleDraft = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      notBlank,
      Validators.maxLength(TITLE_MAX_LENGTH),
      titleNotTaken((title) => this.isTitleTaken()(title, this.task().id)),
    ],
  });

  protected readonly priorityKey = computed(() => TASK_PRIORITY_KEYS[this.task().priority]);
  protected readonly due = computed(() => describeDueDate(this.task(), this.today()));
  protected readonly firstName = computed(() => this.task().assignee.name.split(' ')[0]);
  protected readonly checklistDone = computed(
    () => this.task().checklist.filter((item) => item.done).length,
  );
  protected readonly actions = computed<MenuAction[]>(() => [
    { label: this.language.t('COMMON.EDIT'), command: () => this.editRequest.emit() },
    ...TASK_STATUSES.filter((status) => status !== this.task().status).map((status) => ({
      label: this.language.t('CARD.MOVE_TO', {
        status: this.language.t(TASK_STATUS_KEYS[status]),
      }),
      command: () => this.moveRequest.emit(status),
    })),
    {
      label: this.language.t('COMMON.DELETE'),
      tone: 'danger' as const,
      command: () => this.deleteRequest.emit(),
    },
  ]);
  protected readonly priorityActions = computed<MenuAction[]>(() =>
    TASK_PRIORITIES.filter((priority) => priority !== this.task().priority).map((priority) => ({
      label: this.language.t(TASK_PRIORITY_KEYS[priority]),
      command: () => this.quickEdit.emit({ priority }),
    })),
  );
  protected readonly assigneeActions = computed<MenuAction[]>(() =>
    this.assignees()
      .filter((user) => user.id !== this.task().assignee.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((assignee) => ({
        label: assignee.name,
        command: () => this.quickEdit.emit({ assignee }),
      })),
  );

  protected startTitleEdit(): void {
    if (this.editingTitle()) {
      return;
    }
    this.titleDraft.reset(this.task().title);
    this.editingTitle.set(true);
    afterNextRender(
      () => {
        const field =
          this.host.nativeElement.querySelector<HTMLInputElement>('.card__title-form input');
        field?.focus();
        field?.select();
      },
      { injector: this.injector },
    );
  }

  /** Enter saves and puts focus back on the edit button. An invalid title stays open. */
  protected saveTitle(returnFocus: boolean): void {
    if (!this.editingTitle()) {
      return;
    }
    if (this.titleDraft.invalid) {
      this.titleDraft.markAsTouched();
      return;
    }
    const title = this.titleDraft.value.trim();
    this.stopTitleEdit(returnFocus);
    if (title !== this.task().title) {
      this.quickEdit.emit({ title });
    }
  }

  protected onTitleSubmit(event: Event): void {
    event.preventDefault();
    this.saveTitle(true);
  }

  /** Leaving the field saves, like most inline editors. */
  protected onTitleFocusOut(event: FocusEvent): void {
    const form = event.currentTarget as HTMLElement;
    if (!form.contains(event.relatedTarget as Node | null)) {
      this.saveTitle(false);
    }
  }

  protected cancelTitleEdit(): void {
    if (this.editingTitle()) {
      this.stopTitleEdit(true);
    }
  }

  private stopTitleEdit(returnFocus: boolean): void {
    this.editingTitle.set(false);
    if (returnFocus) {
      afterNextRender(() => this.editTitleButton()?.nativeElement.focus(), {
        injector: this.injector,
      });
    }
  }
}
