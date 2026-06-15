import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalComponent } from '@shared/ui/modal/modal';
import { SuppliersService } from './suppliers-api';
import { Supplier } from './suppliers.models';
import { SupplierFormComponent } from './supplier-form/supplier-form';

@Component({
  selector: 'app-suppliers',
  imports: [FormsModule, ModalComponent, SupplierFormComponent],
  templateUrl: './suppliers.html',
})
export class SuppliersComponent implements OnInit {
  private svc = inject(SuppliersService);
  private destroyRef = inject(DestroyRef);

  suppliers = signal<Supplier[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = signal(20);
  query = signal('');
  statusFilter = signal<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  loading = signal(false);
  error = signal<string | null>(null);
  showModal = signal(false);
  editingSupplier = signal<Supplier | null>(null);
  deactivatingId = signal<number | null>(null);
  restoringId = signal<number | null>(null);

  totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()) || 1);

  private search$ = new Subject<string>();
  searchInput = '';

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => {
        this.query.set(q);
        this.currentPage.set(0);
        this.loadSuppliers();
      });

    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .getSuppliers(this.currentPage(), this.pageSize(), this.query(), this.statusFilter())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.suppliers.set(page.content);
          this.totalElements.set(page.page.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar la lista de proveedores. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
  }

  setStatusFilter(status: 'ACTIVE' | 'INACTIVE'): void {
    this.statusFilter.set(status);
    this.currentPage.set(0);
    this.loadSuppliers();
  }

  openCreate(): void {
    this.editingSupplier.set(null);
    this.showModal.set(true);
  }

  openEdit(supplier: Supplier): void {
    this.editingSupplier.set(supplier);
    this.showModal.set(true);
  }

  onSaved(): void {
    this.showModal.set(false);
    this.loadSuppliers();
  }

  onDeactivate(id: number): void {
    this.deactivatingId.set(id);
    this.error.set(null);
    this.svc
      .deactivateSupplier(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deactivatingId.set(null);
          this.loadSuppliers();
        },
        error: () => {
          this.deactivatingId.set(null);
          this.error.set('No se pudo desactivar el proveedor. Intenta de nuevo.');
        },
      });
  }

  onRestore(id: number): void {
    this.restoringId.set(id);
    this.error.set(null);
    this.svc
      .restoreSupplier(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.restoringId.set(null);
          this.loadSuppliers();
        },
        error: () => {
          this.restoringId.set(null);
          this.error.set('No se pudo restaurar el proveedor. Intenta de nuevo.');
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
    this.loadSuppliers();
  }
}
