import { Injectable, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` styles the confirm button for destructive actions such as deleting. */
  tone?: 'primary' | 'danger';
}

/** Confirmation dialog rendered by the single `<ui-confirm-outlet>` in the app shell. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly confirmation = inject(ConfirmationService);

  /** Resolves `true` when confirmed, `false` when cancelled or dismissed. */
  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmation.confirm({
        header: options.title,
        message: options.message,
        acceptLabel: options.confirmLabel ?? 'Confirm',
        rejectLabel: options.cancelLabel ?? 'Cancel',
        acceptButtonProps: { severity: options.tone === 'danger' ? 'danger' : 'primary' },
        rejectButtonProps: { severity: 'secondary', variant: 'text' },
        // Focus starts on Cancel so Enter never confirms a destructive action by accident.
        defaultFocus: 'reject',
        closeOnEscape: true,
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }
}
