import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ProductsService } from '../products-api';
import { Product } from '@shared/models/product.model';

interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './product-form.html',
})
export class ProductFormComponent {
  product = input<Product | null>(null);
  saved = output<Product>();
  cancelled = output<void>();

  private fb = inject(FormBuilder);
  private svc = inject(ProductsService);

  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    productName: ['', Validators.required],
    categoryId: [null as number | null, Validators.required],
    productBrand: [''],
    productStock: [0, [Validators.required, Validators.min(0)]],
    salePrice: [null as number | null, [Validators.required, Validators.min(1)]],
    costPrice: [null as number | null, [Validators.required, Validators.min(1)]],
    measureUnit: ['UNIT', Validators.required],
    reorderQuantity: [0, Validators.min(0)],
    expirationDate: [''],
    barcode: [''],
  });

  readonly measureUnits = [
    { value: 'UNIT', label: 'Unidad' },
    { value: 'KG', label: 'Kilogramo' },
    { value: 'LITRE', label: 'Litro' },
    { value: 'PACK', label: 'Paquete' },
  ];

  constructor() {
    effect(() => {
      const p = this.product();
      if (p) {
        this.form.patchValue({
          productName: p.productName,
          categoryId: p.categoryId,
          productBrand: p.productBrand ?? '',
          productStock: p.productStock,
          salePrice: p.salePrice,
          costPrice: p.costPrice ?? 0,
          measureUnit: p.measureUnit,
          reorderQuantity: p.reorderQuantity,
          expirationDate: p.expirationDate ?? '',
          barcode: p.barcode ?? '',
        });
      } else {
        this.form.reset();
      }
    });
  }

  get isEditMode(): boolean {
    return this.product() !== null;
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
    const dto: Partial<Product> = {
      productName: raw.productName ?? undefined,
      categoryId: raw.categoryId ?? undefined,
      productBrand: raw.productBrand || null,
      productStock: raw.productStock ?? 0,
      salePrice: raw.salePrice ?? 0,
      costPrice: raw.costPrice ?? null,
      measureUnit: raw.measureUnit ?? 'UNIT',
      reorderQuantity: raw.reorderQuantity ?? 0,
      expirationDate: raw.expirationDate || null,
      barcode: raw.barcode || null,
    };

    const p = this.product();
    const request$ = p ? this.svc.updateProduct(p.productId, dto) : this.svc.createProduct(dto);

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: (result) => this.saved.emit(result),
      error: (err) => {
        const body = err?.error as Partial<ErrorResponse> | null;
        this.errorMessage.set(
          body?.message ?? 'Ocurrió un error al guardar el producto. Intenta de nuevo.',
        );
      },
    });
  }
}
