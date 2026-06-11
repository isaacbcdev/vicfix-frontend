import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  template: `
    <div class="flex flex-col items-center justify-center min-h-[50vh] gap-2">
      <h1 class="text-2xl font-semibold text-text-primary">404 — Página no encontrada</h1>
    </div>
  `,
})
export class NotFoundComponent {}
