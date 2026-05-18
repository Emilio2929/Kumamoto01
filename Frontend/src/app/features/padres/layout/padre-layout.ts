import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { PadreStateService } from '../../../core/services/padre-state.service';
import { NotificacionesService, NotificacionDto } from '../../../core/services/notificaciones.service';

@Component({
  selector: 'app-padre-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './padre-layout.html',
  styleUrls: ['./padre-layout.scss']
})
export class PadreLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  public stateService = inject(PadreStateService);
  private notificacionesService = inject(NotificacionesService);
  private cdr = inject(ChangeDetectorRef);
  
  isSidebarOpen = false;
  isSidebarCollapsed = false;
  user = this.authService.obtenerUsuario();

  // --- Notificaciones ---
  showNotificaciones = false;
  notificaciones: NotificacionDto[] = [];
  unreadCount = 0;

  ngOnInit() {
    this.stateService.cargarHijos();
    this.cargarNotificaciones();
  }

  cargarNotificaciones() {
    this.notificacionesService.getMisNotificaciones().subscribe({
      next: (data) => {
        this.notificaciones = data;
        this.unreadCount = data.filter(n => n.leido === 0).length;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  toggleNotificaciones(event: Event) {
    event.stopPropagation();
    this.showNotificaciones = !this.showNotificaciones;
    if (this.showNotificaciones) {
      this.cargarNotificaciones();
    }
  }

  marcarLeida(notificacion: NotificacionDto, event: Event) {
    event.stopPropagation();
    if (notificacion.leido === 0) {
      this.notificacionesService.marcarComoLeida(notificacion.id).subscribe({
        next: () => {
          notificacion.leido = 1;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.cdr.detectChanges();
        }
      });
    }
  }

  marcarTodasLeidas(event: Event) {
    event.stopPropagation();
    if (this.unreadCount > 0) {
      this.notificacionesService.marcarTodasComoLeidas().subscribe({
        next: () => {
          this.notificaciones.forEach(n => n.leido = 1);
          this.unreadCount = 0;
          this.cdr.detectChanges();
        }
      });
    }
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.showNotificaciones) {
      this.showNotificaciones = false;
    }
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
