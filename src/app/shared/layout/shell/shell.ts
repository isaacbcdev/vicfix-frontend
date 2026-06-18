import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../auth/auth-api';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected loggingOut = signal(false);
  protected sidebarOpen = signal(false);

  protected toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected readonly userInitial = computed(() => (this.auth.user()?.username ?? '?').charAt(0).toUpperCase());

  protected readonly roleDisplay = computed(() => {
    const roles = this.auth.user()?.roles ?? [];
    if (roles.includes('ROLE_ROOT')) return 'Root';
    if (roles.includes('ROLE_ADMIN')) return 'Administrador';
    return 'Vendedor';
  });

  protected logout(): void {
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
    });
  }
}
