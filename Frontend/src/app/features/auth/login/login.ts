import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth';
import { ComunicadosService, Comunicado } from '../../../core/services/comunicados';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  // Estado de modales y portal
  showLoginModal = false;
  loginPortal: 'personal' | 'padres' | 'portal' = 'personal';

  loginForm!: FormGroup;
  cargando = false;
  mensajeError = '';

  comunicados: Comunicado[] = [];
  loadingComunicados = true;
  currentIndex = 0; // Índice de la primera tarjeta visible
  currentPagina = 0;
  paginas: number[] = [];
  carouselInterval: any;
  showMobileMenu = false;

  // Detalle de Comunicado
  showDetailModal = false;
  selectedComunicado: Comunicado | null = null;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private comunicadosSvc: ComunicadosService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
    this.cargarComunicados();
  }

  cargarComunicados(): void {
    this.comunicadosSvc.getAll().subscribe({
      next: (data) => {
        this.comunicados = data;
        this.loadingComunicados = false;
        this.calcularPaginas();
        if (this.comunicados.length > 1) {
          this.iniciarCarrusel();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingComunicados = false;
      }
    });
  }

  calcularPaginas(): void {
    // Si mostramos 3 tarjetas, el número de posiciones posibles es length - 2
    const numPasos = Math.max(0, this.comunicados.length - 2);
    this.paginas = Array(numPasos || 1).fill(0).map((x, i) => i);
  }

  iniciarCarrusel(): void {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
    this.carouselInterval = setInterval(() => {
      this.siguienteGrupo();
    }, 5000); // Cambia cada 5 segundos
  }

  siguienteGrupo(): void {
    if (this.currentIndex < this.comunicados.length - 3) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
    this.actualizarPagina();
  }

  anteriorGrupo(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = Math.max(0, this.comunicados.length - 3);
    }
    this.actualizarPagina();
  }

  setPagina(index: number): void {
    this.currentIndex = index;
    this.currentPagina = index;
    this.iniciarCarrusel();
  }

  private actualizarPagina(): void {
    this.currentPagina = this.currentIndex;
    this.cdr.markForCheck();
  }

  verDetalle(c: Comunicado): void {
    this.selectedComunicado = c;
    this.showDetailModal = true;
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.showDetailModal = false;
    this.selectedComunicado = null;
    this.cdr.markForCheck();
  }

  @HostListener('window:resize')
  onResize() {
    this.calcularPaginas();
    this.currentIndex = 0;
    this.cdr.markForCheck();
  }

  scrollToSection(sectionId: string): void {
    this.showMobileMenu = false; // Cerrar menu al navegar
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getTransform(): string {
    const visible = this.getVisibleCards();
    if (this.comunicados.length <= visible) return 'none';
    const percent = 100 / visible;
    return `translateX(-${this.currentIndex * percent}%)`;
  }

  getVisibleCards(): number {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width < 768) return 1;
    if (width < 1200) return 2;
    return 3;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
  }



  abrirLogin(portal: 'personal' | 'padres' | 'portal'): void {
    this.loginPortal = portal;
    this.showLoginModal = true;
    this.mensajeError = '';
    this.loginForm.reset();
    this.cdr.markForCheck();
  }

  cerrarLogin(): void {
    this.showLoginModal = false;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.valid) {
      this.cargando = true;
      this.mensajeError = '';
      const { correo, password } = this.loginForm.getRawValue() as {
        correo: string;
        password: string;
      };

      this.authService.iniciarSesion(correo, password).subscribe({
        next: (respuesta: any) => {
          // El API devuelve { token, nombres, apellidos, rol }
          const rol = (respuesta?.rol ?? '').toLowerCase();
          const esPersonal = ['director', 'docente', 'auxiliar', 'administrador', 'administrativo'].includes(rol);
          const esPadre = rol === 'padre';

          // Validación de portal
          if (this.loginPortal === 'personal' && !esPersonal) {
            this.mensajeError = 'Este acceso es exclusivo para el Personal de la I.E.';
            this.cargando = false;
            return;
          }

          if (this.loginPortal === 'padres' && !esPadre) {
            this.mensajeError = 'Este acceso es exclusivo para los Padres de Familia.';
            this.cargando = false;
            return;
          }

          this.cargando = false;
          if (rol === 'director') this.router.navigate(['/dashboard/directora']);
          else if (rol === 'docente') this.router.navigate(['/dashboard/docente']);
          else if (rol === 'padre') this.router.navigate(['/dashboard/padre']);
          else if (rol === 'auxiliar') this.router.navigate(['/dashboard/auxiliar']);
          else this.router.navigate(['/dashboard/directora']);
        },
        error: (err) => {
          this.cargando = false;
          this.mensajeError = err.error?.mensaje || 'Credenciales incorrectas. Intenta de nuevo.';
          this.cdr.markForCheck();
        }
      });
    }
  }
}