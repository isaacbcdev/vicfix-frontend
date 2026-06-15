import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../auth/auth-api';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class ShellComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);
  loggingOut = signal(false);

  userInitial = computed(() => (this.auth.user()?.username ?? '?').charAt(0).toUpperCase());

  roleDisplay = computed(() => {
    const roles = this.auth.user()?.roles ?? [];
    if (roles.includes('ROLE_ROOT')) return 'Root';
    if (roles.includes('ROLE_ADMIN')) return 'Administrador';
    return 'Vendedor';
  });

  logout(): void {
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
    });
  }
}
