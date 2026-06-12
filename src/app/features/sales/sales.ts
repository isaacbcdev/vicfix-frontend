import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '@auth/auth-api';
import { ProductsService } from '@features/products/products.service';
import { Product } from '@shared/models/product.model';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { SalesService } from './sales.service';
import { CartItem } from './sales.models';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [FormsModule, CurrencyCopPipe],
  templateUrl: './sales.html',
})
export class SalesComponent {
  private auth = inject(AuthService);
  private productsService = inject(ProductsService);
  private salesService = inject(SalesService);

  cartItems = signal<CartItem[]>([]);
  searchQuery = signal<string>('');
  paymentMethod = signal<'CASH' | 'NEQUI'>('CASH');
  discount = signal<number>(0);
  submitting = signal<boolean>(false);
  submitError = signal<string | null>(null);
  submitSuccess = signal<boolean>(false);

  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.salePrice * item.quantity, 0),
  );
  total = computed(() => Math.max(0, this.subtotal() - this.discount()));
  itemCount = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));
  canSubmit = computed(() => this.cartItems().length > 0 && !this.submitting());

  searchResults = rxResource({
    params: () =>
      this.searchQuery().length >= 2
        ? { query: this.searchQuery(), page: 0, size: 10 }
        : undefined,
    stream: ({ params }) =>
      this.productsService.getProducts(params.page, params.size, params.query),
  });

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  addToCart(product: Product): void {
    this.cartItems.update((items) => {
      const existing = items.find((i) => i.productId === product.productId);
      if (existing) {
        return items.map((i) =>
          i.productId === product.productId
            ? { ...i, quantity: Math.min(999, i.quantity + 1) }
            : i,
        );
      }
      return [
        ...items,
        {
          productId: product.productId,
          productName: product.productName,
          salePrice: product.salePrice,
          quantity: 1,
        },
      ];
    });
    this.searchQuery.set('');
  }

  removeFromCart(productId: number): void {
    this.cartItems.update((items) => items.filter((i) => i.productId !== productId));
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this.cartItems.update((items) =>
      items.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.min(999, quantity) } : i,
      ),
    );
  }

  clearCart(): void {
    this.cartItems.set([]);
  }

  setDiscount(value: string): void {
    const n = parseFloat(value);
    this.discount.set(isNaN(n) || n < 0 ? 0 : n);
  }

  submitSale(): void {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    const payload = {
      userId: this.auth.user()!.id,
      saleDate: new Date().toISOString(),
      paymentMethod: this.paymentMethod(),
      discount: this.discount(),
      comments: '',
      productsSales: this.cartItems().map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        comments: item.comments ?? '',
      })),
    };

    this.salesService
      .createSale(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.clearCart();
          this.discount.set(0);
          this.submitSuccess.set(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => this.submitSuccess.set(false), 3000);
        },
        error: (err) => {
          const msg = err?.error?.message as string | undefined;
          this.submitError.set(
            msg ?? 'No se pudo registrar la venta. Intenta de nuevo.',
          );
        },
      });
  }
}
