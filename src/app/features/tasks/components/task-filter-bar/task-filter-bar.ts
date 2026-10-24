import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../../core/i18n/language.service';
import { TASK_PRIORITIES, TASK_PRIORITY_KEYS, type TaskPriority } from '../../../../core/models';
import { UiFormField } from '../../../../shared/ui/form-field/form-field';
import { UiMultiSelect } from '../../../../shared/ui/multi-select/multi-select';
import { UiSelect } from '../../../../shared/ui/select/select';
import { UiSelectPlaceholder } from '../../../../shared/ui/select-placeholder/select-placeholder';
import type { SelectOption } from '../../../../shared/ui/ui.types';
import type { TaskFilters } from '../../data-access/task-filters';

export type BarFilters = Pick<TaskFilters, 'priorities' | 'assigneeId'>;

/**
 * Priority and assignee dropdowns for the board toolbar; every change is reported at once.
 * The dropdowns load once the board has drawn; until then look-alikes show the filters.
 */
@Component({
  selector: 'app-task-filter-bar',
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    TranslatePipe,
    UiFormField,
    UiMultiSelect,
    UiSelect,
    UiSelectPlaceholder,
  ],
  templateUrl: './task-filter-bar.html',
  styleUrl: './task-filter-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFilterBar {
  readonly filters = input.required<TaskFilters>();
  readonly assignees = input.required<SelectOption<string>[]>();
  /** False while the board is still loading: the dropdowns wait, so they do not delay it. */
  readonly ready = input(true);
  readonly filtersChange = output<BarFilters>();

  private readonly language = inject(LanguageService);

  protected readonly priorityOptions = computed<SelectOption<TaskPriority>[]>(() =>
    TASK_PRIORITIES.map((priority) => ({
      label: this.language.t(TASK_PRIORITY_KEYS[priority]),
      value: priority,
    })),
  );

  /** What the closed dropdowns show: the selection, or their placeholder when empty. */
  protected readonly placeholders = computed(() => {
    const { priorities, assigneeId } = this.filters();
    const [onlyPriority] = priorities;
    const assignee = this.assignees().find((option) => option.value === assigneeId);
    return {
      priorities:
        priorities.length === 0
          ? this.language.t('FILTERS.ALL_PRIORITIES')
          : priorities.length === 1 && onlyPriority
            ? this.language.t(TASK_PRIORITY_KEYS[onlyPriority])
            : // PrimeNG's format, "{0} selected", which ngx-translate does not fill in.
              this.language.t('UI.SELECTED_COUNT').replace('{0}', String(priorities.length)),
      assignee: assignee?.label ?? this.language.t('FILTERS.ALL_ASSIGNEES'),
      noPriorities: priorities.length === 0,
      noAssignee: !assignee,
    };
  });

  protected readonly form = inject(NonNullableFormBuilder).group({
    priorities: [[] as TaskPriority[]],
    assigneeId: [null as string | null],
  });

  constructor() {
    // Filters can also change from outside, e.g. "Clear filters" or the URL.
    effect(() => {
      const { priorities, assigneeId } = this.filters();
      this.form.setValue({ priorities, assigneeId }, { emitEvent: false });
    });

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.filtersChange.emit(this.form.getRawValue());
    });
  }
}
