import { Pipe, type PipeTransform, inject } from '@angular/core';
import type { InterpolationParameters } from '@ngx-translate/core';
import { LanguageService } from './language.service';
import type { PluralKey } from './translation-key';

/**
 * `{{ 'TEAM.MEMBERS' | plural: count }}` gives "1 member", "4 members", or the right
 * Arabic form. Impure, like the translate pipe, so it follows language changes.
 */
@Pipe({ name: 'plural', pure: false })
export class PluralPipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(key: PluralKey, count: number, params?: InterpolationParameters): string {
    return this.language.plural(key, count, params);
  }
}
