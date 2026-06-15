import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';

function firstDayOfCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
import { DatePipe, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth/auth-api';
import { ModalComponent } from '@shared/ui/modal/modal';
import { CurrencyCopPipe } from '@shared/pipes/currency-cop.pipe';
import { SuppliesService } from './supplies.service';
import { Supply } from './supplies.models';
import { SupplyFormComponent } from './supply-form/supply-form';

@Component({
  selector: 'app-supplies',
  imports: [FormsModule, DatePipe, CurrencyCopPipe, ModalComponent, SupplyFormComponent],
  templateUrl: './supplies.html',
})
export class SuppliesComponent implements OnInit {
  protected auth = inject(AuthService);
  private svc = inject(SuppliesService);
  private destroyRef = inject(DestroyRef);

  supplies = signal<Supply[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = signal(20);
  query = signal('');
  statusFilter = signal('');
  startDate = signal(firstDayOfCurrentMonth());
  endDate = signal(today());
  loading = signal(false);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  showModal = signal(false);
  confirmingId = signal<number | null>(null);
  cancelingId = signal<number | null>(null);
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
        this.loadSupplies();
      });

    this.loadSupplies();
  }

  loadSupplies(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .getSupplies(
        this.currentPage(),
        this.pageSize(),
        this.query(),
        this.statusFilter(),
        this.startDate() || undefined,
        this.endDate() || undefined,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.supplies.set(page.content);
          this.totalElements.set(page.page.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar la lista de suministros. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.currentPage.set(0);
    this.loadSupplies();
  }

  onSearchChange(value: string): void {
    this.searchInput = value;
    this.search$.next(value);
  }

  onDateChange(field: 'start' | 'end', value: string): void {
    if (field === 'start') this.startDate.set(value);
    else this.endDate.set(value);
    this.currentPage.set(0);
    this.loadSupplies();
  }

  clearSearch(): void {
    this.searchInput = '';
    this.search$.next('');
  }

  onConfirm(id: number): void {
    this.confirmingId.set(id);
    this.actionError.set(null);
    this.svc
      .confirmSupply(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.confirmingId.set(null);
          this.loadSupplies();
        },
        error: (err) => {
          this.confirmingId.set(null);
          const msg = err?.error?.message as string | undefined;
          this.actionError.set(msg ?? 'No se pudo confirmar el suministro. Intenta de nuevo.');
        },
      });
  }

  onCancel(id: number): void {
    if (
      !window.confirm('¿Cancelar este suministro? Se revertirá el stock si fue entregado.')
    )
      return;

    this.cancelingId.set(id);
    this.actionError.set(null);
    this.svc
      .cancelSupply(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cancelingId.set(null);
          this.loadSupplies();
        },
        error: (err) => {
          this.cancelingId.set(null);
          const msg = err?.error?.message as string | undefined;
          this.actionError.set(msg ?? 'No se pudo cancelar el suministro. Intenta de nuevo.');
        },
      });
  }

  onDelete(id: number): void {
    if (!window.confirm('¿Eliminar este suministro? Esta acción no se puede deshacer.')) return;

    this.deletingId.set(id);
    this.actionError.set(null);
    this.svc
      .deleteSupply(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deletingId.set(null);
          this.loadSupplies();
        },
        error: (err) => {
          this.deletingId.set(null);
          const msg = err?.error?.message as string | undefined;
          this.actionError.set(msg ?? 'No se pudo eliminar el suministro. Intenta de nuevo.');
        },
      });
  }

  onSaved(): void {
    this.showModal.set(false);
    this.loadSupplies();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadSupplies();
  }
}
