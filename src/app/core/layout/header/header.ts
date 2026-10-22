import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UiAvatar } from '../../../shared/ui/avatar/avatar';
import { LanguageService } from '../../i18n/language.service';
import { LANGUAGES } from '../../i18n/languages';

@Component({
  selector: 'app-header',
  imports: [RouterLink, TranslatePipe, UiAvatar],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  /** Whether the mobile navigation drawer is open. */
  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();

  private readonly language = inject(LanguageService);
  /** The language the switch button offers: Arabic while in English, and back. */
  protected readonly otherLanguage = computed(() =>
    this.language.language() === 'ar' ? LANGUAGES.en : LANGUAGES.ar,
  );

  protected switchLanguage(): void {
    void this.language.use(this.otherLanguage().code);
  }
}
