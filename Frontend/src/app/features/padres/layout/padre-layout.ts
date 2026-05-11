import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { PadreStateService } from '../../../core/services/padre-state.service';

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
  public stateService = inject(PadreStateService);
  
  isSidebarOpen = false;
  isSidebarCollapsed = false;
  user = this.authService.obtenerUsuario();

  ngOnInit() {
    this.stateService.cargarHijos();
  }

  seleccionarHijo(hijo: any) {
    this.stateService.seleccionarHijo(hijo);
  }

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
