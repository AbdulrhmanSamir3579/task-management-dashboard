import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiAvatar } from '../../../shared/ui/avatar/avatar';

@Component({
  selector: 'app-header',
  imports: [UiAvatar],
  template: `
    <header class="header">
      <h1 class="header__title">{{ title() }}</h1>
      <div class="header__actions">
        <ui-avatar initials="ME" name="Your profile" />
      </div>
    </header>
  `,
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly title = input.required<string>();
}
