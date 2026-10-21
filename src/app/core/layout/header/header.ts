import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiAvatar } from '../../../shared/ui/avatar/avatar';

@Component({
  selector: 'app-header',
  imports: [RouterLink, UiAvatar],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  /** Whether the mobile navigation drawer is open. */
  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();
}
