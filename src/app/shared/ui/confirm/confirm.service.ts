import { Injectable, computed, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` styles the confirm button for destructive actions such as deleting. */
  tone?: 'primary' | 'danger';
}

interface PendingQuestion {
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
}

/** Confirmation dialog rendered by the single `<ui-confirm-outlet>` in the app shell. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly pending = signal<PendingQuestion | null>(null);

  /** The question on screen, for the outlet; `null` when there is none. */
  readonly question = computed(() => this.pending()?.options ?? null);

  /** Resolves `true` when confirmed, `false` when cancelled or dismissed. */
  confirm(options: ConfirmOptions): Promise<boolean> {
    // A new question replaces one still open, which counts as cancelled.
    this.pending()?.resolve(false);
    return new Promise((resolve) => {
      this.pending.set({
        options,
        resolve,
      });
    });
  }

  /** Called by the outlet with the user's answer. */
  answer(confirmed: boolean): void {
    const pending = this.pending();
    if (pending) {
      this.pending.set(null);
      pending.resolve(confirmed);
    }
  }
}
