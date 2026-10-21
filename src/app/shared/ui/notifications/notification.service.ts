import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

type Severity = 'success' | 'info' | 'warn' | 'error';

/** Toast notifications. Rendered by the single `<ui-toast-outlet>` in the app shell. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messages = inject(MessageService);

  success(message: string, title = 'Done'): void {
    this.show('success', title, message);
  }

  info(message: string, title = 'Info'): void {
    this.show('info', title, message);
  }

  warning(message: string, title = 'Heads up'): void {
    this.show('warn', title, message);
  }

  error(message: string, title = 'Something went wrong'): void {
    this.show('error', title, message, 6000);
  }

  private show(severity: Severity, summary: string, detail: string, life = 4000): void {
    this.messages.add({ severity, summary, detail, life });
  }
}
