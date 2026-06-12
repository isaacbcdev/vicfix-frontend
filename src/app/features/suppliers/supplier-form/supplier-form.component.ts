import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { SuppliersService } from '../suppliers.service';
import { Supplier } from '../suppliers.models';

interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
}

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './supplier-form.component.html',
})
export class SupplierFormComponent {
  supplier = input<Supplier | null>(null);
  saved = output<void>();
  cancelled = output<void>();

  private fb = inject(FormBuilder);
  private svc = inject(SuppliersService);

  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    nit: [''],
    description: [''],
    website: [''],
    businessType: [''],
  });

  constructor() {
    effect(() => {
      const s = this.supplier();
      if (s) {
        this.form.patchValue({
          name: s.name,
          nit: s.nit ?? '',
          description: s.description ?? '',
          website: s.website ?? '',
          businessType: s.businessType ?? '',
        });
      } else {
        this.form.reset();
      }
    });
  }

  get isEditMode(): boolean {
    return this.supplier() !== null;
  }

  fieldError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const req = {
      name: raw.name!,
      nit: raw.nit || undefined,
      description: raw.description || undefined,
      website: raw.website || undefined,
      businessType: raw.businessType || undefined,
    };

    const s = this.supplier();
    const request$ = s
      ? this.svc.updateSupplier(s.supplierId, req)
      : this.svc.createSupplier(req);

    request$
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.saved.emit(),
        error: (err) => {
          const body = err?.error as Partial<ErrorResponse> | null;
          this.errorMessage.set(
            body?.message ?? 'Ocurrió un error al guardar el proveedor. Intenta de nuevo.',
          );
        },
      });
  }
}
