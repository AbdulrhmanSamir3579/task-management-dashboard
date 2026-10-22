import { Pipe, type PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language.service';
import type { TextRef } from './text-ref';

/** `{{ due.text | text }}` renders a `TextRef`; impure, so it follows language changes. */
@Pipe({ name: 'text', pure: false })
export class TextPipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(text: TextRef): string {
    return this.language.text(text);
  }
}
