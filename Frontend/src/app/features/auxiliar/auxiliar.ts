import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-auxiliar-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './auxiliar.html',
  styleUrl: './auxiliar.scss',
})
export class AuxiliarLayoutComponent {
  isSidebarOpen = false;
  isSidebarCollapsed = false;
  isMobile = false;

  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  user = this.auth.obtenerUsuario();

  constructor() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    if (typeof window === 'undefined') return;
    this.isMobile = window.innerWidth <= 768;
    if (window.innerWidth > 768 && window.innerWidth <= 1200) {
      this.isSidebarCollapsed = true;
    } else if (window.innerWidth > 1200) {
      this.isSidebarCollapsed = false;
    }
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.isSidebarOpen = !this.isSidebarOpen;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  closeSidebarOnMobile() {
    if (this.isMobile) this.isSidebarOpen = false;
  }

  logout() {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}

