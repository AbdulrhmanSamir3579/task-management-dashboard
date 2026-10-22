import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, type TaskPriority } from '../../../../core/models';
import { UiFormField } from '../../../../shared/ui/form-field/form-field';
import { UiMultiSelect } from '../../../../shared/ui/multi-select/multi-select';
import { UiSelect } from '../../../../shared/ui/select/select';
import type { SelectOption } from '../../../../shared/ui/ui.types';
import type { TaskFilters } from '../../data-access/task-filters';

export type PanelFilters = Pick<TaskFilters, 'priorities' | 'assigneeId'>;

/** Priority and assignee filters; every change is reported at once. */
@Component({
  selector: 'app-task-filter-panel',
  imports: [ReactiveFormsModule, UiFormField, UiMultiSelect, UiSelect],
  template: `
    <form class="filter-panel" [formGroup]="form">
      <ui-form-field label="Priority" [control]="form.controls.priorities">
        <ui-multi-select
          formControlName="priorities"
          placeholder="Any priority"
          [options]="priorityOptions"
        />
      </ui-form-field>
      <ui-form-field label="Assignee" [control]="form.controls.assigneeId">
        <ui-select
          formControlName="assigneeId"
          placeholder="Anyone"
          [options]="assignees()"
          [clearable]="true"
          [searchable]="true"
        />
      </ui-form-field>
    </form>
  `,
  styles: `
    .filter-panel {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFilterPanel {
  readonly filters = input.required<TaskFilters>();
  readonly assignees = input.required<SelectOption<string>[]>();
  readonly filtersChange = output<PanelFilters>();

  protected readonly priorityOptions: SelectOption<TaskPriority>[] = TASK_PRIORITIES.map(
    (priority) => ({ label: TASK_PRIORITY_LABELS[priority], value: priority }),
  );

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
