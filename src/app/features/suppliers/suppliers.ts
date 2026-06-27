import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalComponent } from '@shared/ui/modal/modal';
import { ConfirmDialogService } from '@shared/ui/confirm-dialog/confirm-dialog.service';
import { SuppliersService } from './suppliers-api';
import { Supplier } from './suppliers.models';
import { SupplierFormComponent } from './supplier-form/supplier-form';

@Component({
  selector: 'app-suppliers',
  imports: [FormsModule, ModalComponent, SupplierFormComponent],
  templateUrl: './suppliers.html',
})
export class SuppliersComponent implements OnInit {
  private readonly svc = inject(SuppliersService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  protected suppliers = signal<Supplier[]>([]);
  protected totalElements = signal(0);
  protected currentPage = signal(0);
  protected pageSize = signal(20);
  protected query = signal('');
  protected statusFilter = signal<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected showModal = signal(false);
  protected editingSupplier = signal<Supplier | null>(null);
  protected deactivatingId = signal<number | null>(null);
  protected restoringId = signal<number | null>(null);

  protected readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()) || 1);

  private search$ = new Subject<string>();
  protected searchInput = signal('');

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

  protected loadSuppliers(): void {
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

  protected setStatusFilter(status: 'ACTIVE' | 'INACTIVE'): void {
    this.statusFilter.set(status);
    this.currentPage.set(0);
    this.loadSuppliers();
  }

  protected openCreate(): void {
    this.editingSupplier.set(null);
    this.showModal.set(true);
  }

  protected openEdit(supplier: Supplier): void {
    this.editingSupplier.set(supplier);
    this.showModal.set(true);
  }

  protected onSaved(): void {
    this.showModal.set(false);
    this.loadSuppliers();
  }

  protected async onDeactivate(id: number): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Desactivar proveedor',
      message: '¿Desactivar este proveedor? Podrás reactivarlo más tarde.',
      confirmLabel: 'Desactivar',
      variant: 'default',
    });
    if (!confirmed) return;
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

  protected onRestore(id: number): void {
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

  protected onSearchChange(value: string): void {
    this.searchInput.set(value);
    this.search$.next(value);
  }

  protected clearSearch(): void {
    this.searchInput.set('');
    this.search$.next('');
  }

  protected goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadSuppliers();
  }
}
