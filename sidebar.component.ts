import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  private router = inject(Router);

  logout(): void {
    // Limpiamos los rastros de la sesión actual
    localStorage.removeItem('kumamoto_jwt');
    localStorage.removeItem('kumamoto_user');
    
    // Navegamos de vuelta al Login
    this.router.navigate(['/login']);
  }
}