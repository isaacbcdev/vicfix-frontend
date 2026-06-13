import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../auth/auth-api';

interface NavLink {
  path: string;
  label: string;
  exact?: boolean;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class ShellComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);
  loggingOut = signal(false);
  logout(): void {
    this.loggingOut.set(true);
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
    });
  }

  readonly navLinks: NavLink[] = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/products', label: 'Productos' },
    { path: '/sales', label: 'Nueva Venta', exact: true },
    { path: '/sales/history', label: 'Historial' },
    { path: '/platforms', label: 'Plataformas' },
    { path: '/reports', label: 'Reportes' },
    { path: '/close', label: 'Cierre del Día' },
    { path: '/suppliers', label: 'Proveedores' },
    { path: '/users', label: 'Usuarios' },
  ];
}
