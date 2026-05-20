import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { DocenteService } from '../../../core/services/docente';

@Component({
  selector: 'app-docente',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './docente.html',
  styleUrls: ['./docente.scss'],
})
export class Docente implements OnInit {
  isSidebarOpen = false;
  isSidebarCollapsed = false;
  isMobile = false;
  tutorias: any[] = [];

  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly docenteService = inject(DocenteService);
  private readonly cdr = inject(ChangeDetectorRef);

  user = this.auth.obtenerUsuario();

  constructor() {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.docenteService.getMisTutorias().subscribe({
      next: (res) => {
        this.tutorias = res || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.tutorias = [];
        this.cdr.detectChanges();
      }
    });
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
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  logout() {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
