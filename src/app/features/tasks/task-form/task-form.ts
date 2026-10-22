import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type FormArray,
  type FormControl,
  type FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { type Observable, filter, firstValueFrom, of } from 'rxjs';
import {
  type ChecklistItem,
  type CreateTaskPayload,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '../../../core/models';
import { UiButton } from '../../../shared/ui/button/button';
import { UiCheckbox } from '../../../shared/ui/checkbox/checkbox';
import { UiDatePicker } from '../../../shared/ui/date-picker/date-picker';
import { UiFormField } from '../../../shared/ui/form-field/form-field';
import { UiInputText } from '../../../shared/ui/input-text/input-text';
import { UiSelect } from '../../../shared/ui/select/select';
import { UiTagsInput } from '../../../shared/ui/tags-input/tags-input';
import { UiTextarea } from '../../../shared/ui/textarea/textarea';
import type { SelectOption } from '../../../shared/ui/ui.types';
import { toIsoDate } from '../../../shared/utils/date.utils';
import {
  dateNotAfter,
  dateNotBefore,
  maxItemLength,
  maxItems,
  notBlank,
  uniqueTitle,
} from './task-form.validators';

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
export const MAX_TAGS = 5;
export const TAG_MAX_LENGTH = 20;
export const MAX_CHECKLIST_ITEMS = 10;
export const CHECKLIST_ITEM_MAX_LENGTH = 80;

interface ChecklistItemControls {
  text: FormControl<string>;
  done: FormControl<boolean>;
}

interface TaskFormControls {
  title: FormControl<string>;
  description: FormControl<string>;
  status: FormControl<TaskStatus>;
  priority: FormControl<TaskPriority>;
  dueDate: FormControl<string | null>;
  assigneeId: FormControl<string | null>;
  tags: FormControl<string[]>;
  /** Dynamic list of steps: rows are added and removed by the user. */
  checklist: FormArray<FormGroup<ChecklistItemControls>>;
  /** Only present while the status is Done. */
  completedOn?: FormControl<string | null>;
}

const today = (): string => toIsoDate(new Date());

/** Noon keeps the chosen day the same in every time zone. */
const toTimestamp = (day: string): string => new Date(`${day}T12:00:00`).toISOString();

/**
 * Create or edit a task. Presentational: it validates and emits the payload; saving,
 * users and the duplicate-title lookup come from the parent.
 */
@Component({
  selector: 'app-task-form',
  imports: [
    ReactiveFormsModule,
    UiFormField,
    UiInputText,
    UiTextarea,
    UiSelect,
    UiDatePicker,
    UiTagsInput,
    UiCheckbox,
    UiButton,
  ],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** The task to edit; `null` creates a new one. */
  readonly task = input<Task | null>(null);
  /** Assignee filled in for a new task; ignored when editing. */
  readonly defaultAssigneeId = input<string | null>(null);
  /** Due date filled in for a new task; ignored when editing. */
  readonly defaultDueDate = input<string | null>(null);
  readonly assignees = input<SelectOption<string>[]>([]);
  readonly saving = input(false);
  /** Whether another task already uses a title; the edited task is ignored by the caller. */
  readonly isTitleTaken = input<(title: string) => Observable<boolean>>(() => of(false));
  readonly saved = output<CreateTaskPayload>();
  readonly cancelled = output<void>();

  protected readonly statusOptions: SelectOption<TaskStatus>[] = TASK_STATUSES.map((status) => ({
    label: TASK_STATUS_LABELS[status],
    value: status,
  }));
  protected readonly priorityOptions: SelectOption<TaskPriority>[] = TASK_PRIORITIES.map(
    (priority) => ({ label: TASK_PRIORITY_LABELS[priority], value: priority }),
  );
  protected readonly limits = {
    title: TITLE_MAX_LENGTH,
    description: DESCRIPTION_MAX_LENGTH,
    tags: MAX_TAGS,
    checklist: MAX_CHECKLIST_ITEMS,
    checklistItem: CHECKLIST_ITEM_MAX_LENGTH,
  };
  protected readonly minDueDate = signal(today());
  protected readonly showCompletedOn = signal(false);

  protected readonly form = this.fb.group<TaskFormControls>({
    title: this.fb.control('', {
      validators: [Validators.required, notBlank, Validators.maxLength(TITLE_MAX_LENGTH)],
      asyncValidators: [uniqueTitle((title) => this.isTitleTaken()(title))],
    }),
    description: this.fb.control('', Validators.maxLength(DESCRIPTION_MAX_LENGTH)),
    status: this.fb.control<TaskStatus>('todo'),
    priority: this.fb.control<TaskPriority>('medium'),
    dueDate: this.fb.control<string | null>(null),
    assigneeId: this.fb.control<string | null>(null, Validators.required),
    tags: this.fb.control<string[]>(
      [],
      [maxItems(MAX_TAGS, 'VALIDATION.MAX_TAGS'), maxItemLength(TAG_MAX_LENGTH)],
    ),
    checklist: this.fb.array<FormGroup<ChecklistItemControls>>(
      [],
      maxItems(MAX_CHECKLIST_ITEMS, 'VALIDATION.MAX_CHECKLIST_ITEMS'),
    ),
  });

  constructor() {
    // Dynamic control: "Completed on" exists only while the status is Done.
    this.form.controls.status.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((status) => this.syncCompletedOn(status, this.task()?.completedAt ?? null));

    effect(() => {
      const task = this.task();
      untracked(() => this.fill(task));
    });
  }

  protected get completedOn(): FormControl<string | null> | undefined {
    return this.form.controls.completedOn;
  }

  protected get checklist(): FormArray<FormGroup<ChecklistItemControls>> {
    return this.form.controls.checklist;
  }

  protected checklistDone(): number {
    return this.checklist.controls.filter((item) => item.controls.done.value).length;
  }

  protected addChecklistItem(): void {
    this.checklist.push(this.createChecklistItem());
    this.checklist.markAsDirty();
    this.focusAfterRender('.checklist__text input', 'last');
  }

  protected removeChecklistItem(index: number): void {
    this.checklist.removeAt(index);
    this.checklist.markAsDirty();
    this.focusAfterRender('.checklist__add button', 'first');
  }

  /** True when the user changed something since the form was filled. */
  hasChanges(): boolean {
    return this.form.dirty;
  }

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.pending) {
      // Wait for the duplicate-title check instead of submitting with an unknown result.
      // The check is run again first: one started by the form directive on first render
      // runs silently and would never report that it finished.
      const settled = firstValueFrom(
        this.form.statusChanges.pipe(filter((status) => status !== 'PENDING')),
      );
      this.form.controls.title.updateValueAndValidity();
      await settled;
    }
    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }

    const value = this.form.getRawValue();
    const payload: CreateTaskPayload = {
      title: value.title.trim(),
      description: value.description.trim(),
      status: value.status,
      priority: value.priority,
      dueDate: value.dueDate ?? today(),
      assigneeId: value.assigneeId ?? '',
      tags: value.tags,
      checklist: value.checklist.map((item) => ({ text: item.text.trim(), done: item.done })),
    };
    if (value.status === 'done' && value.completedOn) {
      payload.completedAt = toTimestamp(value.completedOn);
    }
    this.saved.emit(payload);
  }

  private fill(task: Task | null): void {
    this.minDueDate.set(today());
    this.form.controls.dueDate.setValidators([
      Validators.required,
      dateNotBefore(today, task?.dueDate ?? null),
    ]);
    this.checklist.clear();
    this.form.reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? 'todo',
      priority: task?.priority ?? 'medium',
      dueDate: task ? task.dueDate : this.defaultDueDate(),
      assigneeId: task ? task.assignee.id : this.defaultAssigneeId(),
      tags: [...(task?.tags ?? [])],
    });
    for (const item of task?.checklist ?? []) {
      this.checklist.push(this.createChecklistItem(item));
    }
    this.syncCompletedOn(this.form.controls.status.value, task?.completedAt ?? null);
    this.form.markAsPristine();
  }

  private createChecklistItem(item?: ChecklistItem): FormGroup<ChecklistItemControls> {
    return this.fb.group({
      text: this.fb.control(item?.text ?? '', [
        Validators.required,
        notBlank,
        Validators.maxLength(CHECKLIST_ITEM_MAX_LENGTH),
      ]),
      done: this.fb.control(item?.done ?? false),
    });
  }

  private syncCompletedOn(status: TaskStatus, completedAt: string | null): void {
    const isDone = status === 'done';
    if (isDone && !this.form.contains('completedOn')) {
      this.form.addControl(
        'completedOn',
        this.fb.control<string | null>(completedAt ? toIsoDate(new Date(completedAt)) : today(), [
          Validators.required,
          dateNotAfter(today),
        ]),
      );
    } else if (!isDone && this.form.contains('completedOn')) {
      this.form.removeControl('completedOn');
    }
    this.showCompletedOn.set(isDone);
  }

  /** Errors render on the next frame; focus the first field that has one. */
  private focusFirstInvalid(): void {
    this.focusAfterRender('[aria-invalid="true"], .ng-invalid [role="combobox"]', 'first');
  }

  private focusAfterRender(selector: string, which: 'first' | 'last'): void {
    afterNextRender(
      () => {
        const matches = this.host.nativeElement.querySelectorAll<HTMLElement>(selector);
        matches[which === 'first' ? 0 : matches.length - 1]?.focus();
      },
      { injector: this.injector },
    );
  }
}
