import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UsersStore } from '../../core/data-access/users.store';
import { LanguageService } from '../../core/i18n/language.service';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { UiButton } from '../../shared/ui/button/button';
import { UiSkeleton } from '../../shared/ui/skeleton/skeleton';
import { TaskEditorStore } from '../tasks/data-access/task-editor.store';
import { TasksStore } from '../tasks/data-access/tasks.store';
import { MemberCard } from './components/member-card/member-card';
import { summarizeTeam } from './data-access/team-summary';

/** Everyone who can be assigned tasks, with their workload; follows changes on the board. */
@Component({
  selector: 'app-team-page',
  imports: [EmptyState, MemberCard, TranslatePipe, UiButton, UiSkeleton],
  templateUrl: './team.page.html',
  styleUrl: './team.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage {
  private readonly users = inject(UsersStore);
  private readonly tasks = inject(TasksStore);
  private readonly editor = inject(TaskEditorStore);
  private readonly language = inject(LanguageService);

  protected readonly skeletons = [0, 1, 2, 3];

  protected readonly loadFailed = computed(
    () =>
      (!this.users.hasLoaded() && this.users.hasError()) ||
      (!this.tasks.hasLoaded() && this.tasks.loadError() !== null),
  );

  /** `null` until both the people and their tasks have loaded. */
  protected readonly members = computed(() =>
    this.users.hasLoaded() && this.tasks.hasLoaded()
      ? summarizeTeam(this.users.users(), this.tasks.entities())
      : null,
  );

  protected readonly summary = computed(() => {
    const members = this.members() ?? [];
    const open = members.reduce((sum, member) => sum + member.open, 0);
    const overdue = members.reduce((sum, member) => sum + member.overdue, 0);
    return [
      this.language.plural('TEAM.MEMBERS', members.length),
      this.language.plural('TEAM.OPEN_TASKS', open),
      this.language.t('TEAM.OVERDUE_COUNT', { count: overdue }),
    ].join(' · ');
  });

  protected retry(): void {
    if (!this.users.hasLoaded()) {
      this.users.reload();
    }
    if (!this.tasks.hasLoaded()) {
      this.tasks.reload();
    }
  }

  protected assignTo(assigneeId: string): void {
    this.editor.openCreate({ assigneeId });
  }
}
