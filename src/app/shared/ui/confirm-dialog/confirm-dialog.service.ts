import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly visible = signal(false);
  readonly title = signal('Confirmar');
  readonly message = signal('');
  readonly confirmLabel = signal('Confirmar');
  readonly cancelLabel = signal('Cancelar');
  readonly variant = signal<'default' | 'danger'>('default');

  private resolveFn: ((value: boolean) => void) | null = null;

  confirm(options: ConfirmOptions): Promise<boolean> {
    this.title.set(options.title ?? 'Confirmar');
    this.message.set(options.message);
    this.confirmLabel.set(options.confirmLabel ?? 'Confirmar');
    this.cancelLabel.set(options.cancelLabel ?? 'Cancelar');
    this.variant.set(options.variant ?? 'default');
    this.visible.set(true);
    return new Promise((resolve) => {
      this.resolveFn = resolve;
    });
  }

  respond(result: boolean): void {
    this.visible.set(false);
    this.resolveFn?.(result);
    this.resolveFn = null;
  }
}
