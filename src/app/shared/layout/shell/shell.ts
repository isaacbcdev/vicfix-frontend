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
    { path: '/productos', label: 'Productos' },
    { path: '/ventas', label: 'Nueva Venta' },
    { path: '/plataformas', label: 'Plataformas' },
    { path: '/reportes', label: 'Reportes' },
    { path: '/cierre', label: 'Cierre del Día' },
    { path: '/proveedores', label: 'Proveedores' },
    { path: '/usuarios', label: 'Usuarios' },
  ];
}
