import {
  Component,
  inject,
  signal,
  computed,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductsService } from './products.service';
import { Product } from '@shared/models/product.model';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, CurrencyCopPipe],
  templateUrl: './products.html',
})
export class ProductsComponent implements OnInit {
  private svc = inject(ProductsService);
  private destroyRef = inject(DestroyRef);

  products = signal<Product[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = signal(20);
  query = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

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
