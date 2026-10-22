import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

type Severity = 'success' | 'info' | 'warn' | 'error';

/** Toast notifications. Rendered by the single `<ui-toast-outlet>` in the app shell. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  /** Titles default to a translated "Done", "Info", "Heads up" or "Something went wrong". */
  success(message: string, title?: string): void {
    this.show('success', title ?? this.text('TOAST.SUCCESS'), message);
  }

  info(message: string, title?: string): void {
    this.show('info', title ?? this.text('TOAST.INFO'), message);
  }

  warning(message: string, title?: string): void {
    this.show('warn', title ?? this.text('TOAST.WARNING'), message);
  }

  error(message: string, title?: string): void {
    this.show('error', title ?? this.text('TOAST.ERROR'), message, 6000);
  }

  private text(key: string): string {
    return this.translate.instant(key) as string;
  }

  private show(severity: Severity, summary: string, detail: string, life = 4000): void {
    this.messages.add({ severity, summary, detail, life });
  }
}
