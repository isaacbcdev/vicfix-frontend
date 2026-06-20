import { Component, computed, HostListener, inject } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialogComponent {
  protected readonly svc = inject(ConfirmDialogService);

  protected readonly confirmBtnClass = computed(() =>
    this.svc.variant() === 'danger'
      ? 'px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors'
      : 'px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-emerald-700 transition-colors',
  );

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.svc.visible()) {
      this.svc.respond(false);
    }
  }
}
