import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-padre-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './padre-layout.html',
  styleUrls: ['./padre-layout.scss']
})
export class PadreLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  isSidebarOpen = false;
  isSidebarCollapsed = false;
  user = this.authService.obtenerUsuario();

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebarOnMobile() {
    this.isSidebarOpen = false;
  }

  logout() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
