import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
})
export class ModalComponent {
  title = input<string>('');
  isOpen = input<boolean>(false);
  closed = output<void>();

  close(): void {
    this.closed.emit();
  }
}
