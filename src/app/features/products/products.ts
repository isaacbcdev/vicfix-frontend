import { Component, inject, signal, computed, DestroyRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductsService } from './products-api';
import { AuthService } from '@auth/auth-api';
import { Product } from '@shared/models/product.model';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ProductFormComponent } from './product-form/product-form';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, CurrencyCopPipe, ModalComponent, ProductFormComponent],
  templateUrl: './products.html',
})
export class ProductsComponent implements OnInit {
  private svc = inject(ProductsService);
  private destroyRef = inject(DestroyRef);
  protected auth = inject(AuthService);

  products = signal<Product[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = signal(20);
  query = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  showModal = signal(false);
  editingProduct = signal<Product | null>(null);
  deletingId = signal<number | null>(null);

  totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()) || 1);

  private search$ = new Subject<string>();
  searchInput = '';

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => {
        this.query.set(q);
        this.currentPage.set(0);
        this.loadProducts();
      });

    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .getProducts(this.currentPage(), this.pageSize(), this.query())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.products.set(page.content);
          this.totalElements.set(page.page.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar la lista de productos. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
  }

  openCreate(): void {
    this.editingProduct.set(null);
    this.showModal.set(true);
  }

  openEdit(product: Product): void {
    this.editingProduct.set(product);
    this.showModal.set(true);
  }

  onProductSaved(_product: Product): void {
    this.showModal.set(false);
    this.loadProducts();
  }

  deleteProduct(id: number): void {
    this.deletingId.set(id);
    this.error.set(null);
    this.svc
      .deleteProduct(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deletingId.set(null);
          this.loadProducts();
        },
        error: () => {
          this.deletingId.set(null);
          this.error.set('No se pudo eliminar el producto. Intenta de nuevo.');
        },
      });
  }

  onSearchChange(value: string): void {
    this.searchInput = value;
    this.search$.next(value);
  }

  clearSearch(): void {
    this.searchInput = '';
    this.search$.next('');
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  statusClass(status: Product['status']): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-700';
      case 'LOW_STOCK':
        return 'bg-amber-100 text-amber-700';
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-700';
      case 'EXPIRED':
        return 'bg-slate-100 text-slate-500';
    }
  }
}
