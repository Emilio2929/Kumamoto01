import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-directora',
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './directora.html',
  styleUrl: './directora.scss',
})
export class Directora {
  isSidebarOpen: boolean = false; // For mobile toggle
  isSidebarCollapsed: boolean = false; // For desktop toggle
  isMobile: boolean = false;
  private router = inject(Router);

  constructor() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth <= 768;
      if (window.innerWidth > 768 && window.innerWidth <= 1200) {
        this.isSidebarCollapsed = true;
      } else if (window.innerWidth > 1200) {
        this.isSidebarCollapsed = false;
      }
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
    this.router.navigate(['/login']);
  }
}
