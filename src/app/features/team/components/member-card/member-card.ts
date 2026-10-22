import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UiAvatar } from '../../../../shared/ui/avatar/avatar';
import { UiButton } from '../../../../shared/ui/button/button';
import type { TeamMember } from '../../data-access/team-summary';

let nextId = 0;

/** One team member: contact, task counts, progress, and ways to see or add their tasks. */
@Component({
  selector: 'app-member-card',
  imports: [RouterLink, TranslatePipe, UiAvatar, UiButton],
  templateUrl: './member-card.html',
  styleUrl: './member-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberCard {
  readonly member = input.required<TeamMember>();
  /** Emits the member's user id when "Assign task" is pressed. */
  readonly assign = output<string>();

  protected readonly nameId = `member-name-${nextId++}`;
}
