import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavLink {
  path: string;
  label: string;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class ShellComponent {
  readonly navLinks: NavLink[] = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/products', label: 'Productos' },
    { path: '/sales', label: 'Nueva Venta' },
    { path: '/platforms', label: 'Plataformas' },
    { path: '/reports', label: 'Reportes' },
    { path: '/close', label: 'Cierre del Día' },
    { path: '/suppliers', label: 'Proveedores' },
    { path: '/users', label: 'Usuarios' },
  ];
}
