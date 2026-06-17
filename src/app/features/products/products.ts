import { Component, inject, signal, computed, DestroyRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductsService } from './products-api';
import { CategoriesService } from './categories-api';
import { AuthService } from '@auth/auth-api';
import { Category, Product } from '@shared/models/product.model';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { ModalComponent } from '@shared/ui/modal/modal';
import { ProductFormComponent } from './product-form/product-form';

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'SERVICIOS DIGITALES E IMPRESIONES': 'Servicios Digitales',
  MISCELANEA: 'Miscelánea',
  POLITOS: 'Politos',
};

@Component({
  selector: 'app-products',
  imports: [FormsModule, CurrencyCopPipe, ModalComponent, ProductFormComponent],
  templateUrl: './products.html',
})
export class ProductsComponent implements OnInit {
  private readonly svc = inject(ProductsService);
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  protected products = signal<Product[]>([]);
  protected totalElements = signal(0);
  protected currentPage = signal(0);
  protected pageSize = signal(20);
  protected query = signal('');
  protected loading = signal(false);
  protected error = signal<string | null>(null);

  protected selectedCategoryId = signal<number | null>(null);
  protected selectedStatus = signal<string | null>(null);
  protected lowStock = signal(false);
  protected categories = signal<Category[]>([]);
  protected categoriesLoading = signal(false);

  protected showModal = signal(false);
  protected editingProduct = signal<Product | null>(null);
  protected deletingId = signal<number | null>(null);

  protected readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()) || 1);

  protected readonly productCountLabel = computed(() => {
    const count = this.totalElements();
    const filtered =
      this.selectedCategoryId() !== null ||
      this.selectedStatus() !== null ||
      this.lowStock() ||
      this.query() !== '';
    const suffix = count === 1 ? '' : 's';
    return filtered
      ? `${count} producto${suffix}`
      : `${count} producto${suffix} registrado${suffix}`;
  });

  protected readonly statusOptions = [
    { value: null, label: 'Todos' },
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'LOW_STOCK', label: 'Stock bajo' }, // sentinel — handled specially in setStatus()
    { value: 'OUT_OF_STOCK', label: 'Agotado' },
  ];

  private search$ = new Subject<string>();
  protected searchInput = '';

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => {
        this.query.set(q);
        this.currentPage.set(0);
        this.loadProducts();
      });

    this.loadCategories();
    this.loadProducts();
  }

  protected loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoriesSvc
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cats) => {
          this.categories.set(cats);
          this.categoriesLoading.set(false);
        },
        error: () => this.categoriesLoading.set(false),
      });
  }

  protected loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .getProducts(
        this.currentPage(),
        this.pageSize(),
        this.query(),
        this.selectedCategoryId(),
        this.selectedStatus(),
        this.lowStock(),
      )
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

  protected setCategory(id: number | null): void {
    this.selectedCategoryId.set(id);
    this.lowStock.set(false);
    this.currentPage.set(0);
    this.loadProducts();
  }

  protected setStatus(status: string | null): void {
    if (status === 'LOW_STOCK') {
      this.selectedStatus.set(null);
      this.lowStock.set(true);
    } else {
      this.selectedStatus.set(status);
      this.lowStock.set(false);
    }
    this.currentPage.set(0);
    this.loadProducts();
  }

  protected isStatusActive(value: string | null): boolean {
    if (value === 'LOW_STOCK') return this.lowStock();
    if (value === null || value === '') {
      return !this.lowStock() && this.selectedStatus() === null;
    }
    return this.selectedStatus() === value;
  }

  protected displayCategoryName(name: string): string {
    return (
      CATEGORY_DISPLAY_NAMES[name.toUpperCase()] ??
      name.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    );
  }

  protected openCreate(): void {
    this.editingProduct.set(null);
    this.showModal.set(true);
  }

  protected openEdit(product: Product): void {
    this.editingProduct.set(product);
    this.showModal.set(true);
  }

  protected onProductSaved(_product: Product): void {
    this.showModal.set(false);
    this.loadProducts();
  }

  protected deleteProduct(id: number): void {
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

  protected onSearchChange(value: string): void {
    this.searchInput = value;
    this.search$.next(value);
  }

  protected clearSearch(): void {
    this.searchInput = '';
    this.search$.next('');
  }

  protected goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  protected statusClass(status: Product['status']): string {
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
