import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ProductsService } from '@features/products/products-api';
import { SuppliersService } from '@features/suppliers/suppliers-api';
import { Supplier } from '@features/suppliers/suppliers.models';
import { Product } from '@shared/models/product.model';
import { SuppliesService } from '../supplies-api';

interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
}

@Component({
  selector: 'app-supply-form',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './supply-form.html',
})
export class SupplyFormComponent {
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly suppliesService = inject(SuppliesService);
  private readonly productsService = inject(ProductsService);
  private readonly suppliersService = inject(SuppliersService);
  private readonly destroyRef = inject(DestroyRef);

  protected submitting = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected suppliers = signal<Supplier[]>([]);
  protected suppliersLoading = signal(false);

  protected productSearchQuery = signal('');
  protected selectedProduct = signal<{ id: number; name: string } | null>(null);
  protected showProductDropdown = signal(false);

  protected productResults = rxResource({
    params: () =>
      this.productSearchQuery().length >= 2
        ? { query: this.productSearchQuery(), page: 0, size: 10 }
        : undefined,
    stream: ({ params }) =>
      this.productsService.getProducts(params.page, params.size, params.query),
  });

  readonly today = new Date().toISOString().split('T')[0];

  protected form = this.fb.group({
    supplierId: [null as number | null, Validators.required],
    productId: [null as number | null, Validators.required],
    quantity: [null as number | null, [Validators.required, Validators.min(1)]],
    pricePerUnit: [null as number | null, [Validators.required, Validators.min(1)]],
    supplyDate: [this.today, Validators.required],
    status: ['DELIVERED' as 'PENDING' | 'DELIVERED', Validators.required],
    comments: [''],
  });

  constructor() {
    this.loadSuppliers();
  }

  private loadSuppliers(): void {
    this.suppliersLoading.set(true);
    this.suppliersService
      .getSuppliers(0, 50, '', 'ACTIVE')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.suppliers.set(page.content);
          this.suppliersLoading.set(false);
        },
        error: () => this.suppliersLoading.set(false),
      });
  }

  protected onProductSearch(value: string): void {
    this.productSearchQuery.set(value);
    this.showProductDropdown.set(value.length >= 2);
    if (!value) this.clearProduct();
  }

  protected selectProduct(product: Product): void {
    this.selectedProduct.set({ id: product.productId, name: product.productName });
    this.form.patchValue({ productId: product.productId });
    this.productSearchQuery.set('');
    this.showProductDropdown.set(false);
  }

  protected clearProduct(): void {
    this.selectedProduct.set(null);
    this.form.patchValue({ productId: null });
  }

  protected fieldError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const req = {
      supplierId: raw.supplierId!,
      productId: raw.productId!,
      quantity: Number(raw.quantity),
      pricePerUnit: Number(raw.pricePerUnit),
      supplyDate: `${raw.supplyDate}T00:00:00`,
      status: raw.status!,
      comments: raw.comments || undefined,
    };

    this.suppliesService
      .createSupply(req)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.saved.emit(),
        error: (err) => {
          const body = err?.error as Partial<ErrorResponse> | null;
          this.errorMessage.set(
            body?.message ?? 'Ocurrió un error al registrar el suministro. Intenta de nuevo.',
          );
        },
      });
  }
}
