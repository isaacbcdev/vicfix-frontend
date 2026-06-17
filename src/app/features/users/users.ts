import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalComponent } from '@shared/ui/modal/modal';
import { AuthService } from '../../auth/auth-api';
import { UsersService } from './users-api';
import { UserModel } from './users.models';
import { UserFormComponent } from './user-form/user-form';

@Component({
  selector: 'app-users',
  imports: [FormsModule, ModalComponent, UserFormComponent],
  templateUrl: './users.html',
})
export class UsersComponent implements OnInit {
  private readonly svc = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly authService = inject(AuthService);

  protected users = signal<UserModel[]>([]);
  protected totalElements = signal(0);
  protected currentPage = signal(0);
  protected pageSize = signal(20);
  protected query = signal('');
  protected activeFilter = signal<boolean | null>(null);
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected showModal = signal(false);
  protected editingUser = signal<UserModel | null>(null);
  protected togglingId = signal<number | null>(null);

  protected readonly totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()) || 1);

  private search$ = new Subject<string>();
  protected searchInput = '';

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => {
        this.query.set(q);
        this.currentPage.set(0);
        this.loadUsers();
      });

    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    const active = this.activeFilter();
    this.svc
      .getUsers(this.currentPage(), this.pageSize(), this.query(), active ?? undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.users.set(page.content);
          this.totalElements.set(page.page.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar la lista de usuarios. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
  }

  protected setActiveFilter(value: boolean | null): void {
    this.activeFilter.set(value);
    this.currentPage.set(0);
    this.loadUsers();
  }

  protected openCreate(): void {
    this.editingUser.set(null);
    this.showModal.set(true);
  }

  protected openEdit(user: UserModel): void {
    this.editingUser.set(user);
    this.showModal.set(true);
  }

  protected onSaved(): void {
    this.showModal.set(false);
    this.loadUsers();
  }

  protected onToggleStatus(user: UserModel): void {
    this.togglingId.set(user.id);
    this.error.set(null);
    this.svc
      .updateStatus(user.id, !user.active)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.togglingId.set(null);
          this.loadUsers();
        },
        error: () => {
          this.togglingId.set(null);
          this.error.set('No se pudo cambiar el estado del usuario. Intenta de nuevo.');
        },
      });
  }

  protected isCurrentUser(user: UserModel): boolean {
    return user.username === this.authService.user()?.username;
  }

  protected roleBadgeClass(roleName: string): string {
    const upper = roleName.toUpperCase();
    if (upper.includes('ADMIN') || upper.includes('ROOT')) {
      return 'bg-emerald-100 text-emerald-700';
    }
    return 'bg-slate-100 text-slate-600';
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
    this.loadUsers();
  }
}
