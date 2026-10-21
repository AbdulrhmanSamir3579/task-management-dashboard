import { Pipe, type PipeTransform } from '@angular/core';
import { type HighlightPart, highlightParts } from '../utils/highlight';

/**
 * `@for (part of task.title | highlight: query; track $index)` gives the matched and
 * unmatched parts of a text, to render matches in `<mark>`.
 */
@Pipe({ name: 'highlight' })
export class HighlightPipe implements PipeTransform {
  transform(text: string | null | undefined, query: string): HighlightPart[] {
    return highlightParts(text ?? '', query);
  }
}
