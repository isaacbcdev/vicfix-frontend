import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
})
export class ModalComponent {
  readonly title = input<string>('');
  readonly isOpen = input<boolean>(false);
  readonly closeOnBackdropClick = input<boolean>(true);
  readonly closed = output<void>();

  close(): void {
    this.closed.emit();
  }
}
