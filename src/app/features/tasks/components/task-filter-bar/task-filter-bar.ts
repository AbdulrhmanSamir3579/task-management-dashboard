import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, type TaskPriority } from '../../../../core/models';
import { UiFormField } from '../../../../shared/ui/form-field/form-field';
import { UiMultiSelect } from '../../../../shared/ui/multi-select/multi-select';
import { UiSelect } from '../../../../shared/ui/select/select';
import type { SelectOption } from '../../../../shared/ui/ui.types';
import type { TaskFilters } from '../../data-access/task-filters';

export type BarFilters = Pick<TaskFilters, 'priorities' | 'assigneeId'>;

/** Priority and assignee dropdowns for the board toolbar; every change is reported at once. */
@Component({
  selector: 'app-task-filter-bar',
  imports: [ReactiveFormsModule, UiFormField, UiMultiSelect, UiSelect],
  template: `
    <form class="filter-bar" [formGroup]="form">
      <ui-form-field label="Priority" [labelVisible]="false" [control]="form.controls.priorities">
        <ui-multi-select
          formControlName="priorities"
          placeholder="All priorities"
          [compact]="true"
          [options]="priorityOptions"
        />
      </ui-form-field>
      <ui-form-field label="Assignee" [labelVisible]="false" [control]="form.controls.assigneeId">
        <ui-select
          formControlName="assigneeId"
          placeholder="All assignees"
          [options]="assignees()"
          [clearable]="true"
          [searchable]="true"
        />
      </ui-form-field>
    </form>
  `,
  styles: `
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    ui-form-field {
      width: 11rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFilterBar {
  readonly filters = input.required<TaskFilters>();
  readonly assignees = input.required<SelectOption<string>[]>();
  readonly filtersChange = output<BarFilters>();

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
