import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
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
  showAllComunicados = false;
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

  // Getter: muestra 6 tarjetas o todas si se presiona "Ver más"
  get displayedComunicados(): Comunicado[] {
    if (this.showAllComunicados || this.comunicados.length <= 6) {
      return this.comunicados;
    }
    return this.comunicados.slice(0, 6);
  }

  cargarComunicados(): void {
    this.comunicadosSvc.getAll().subscribe({
      next: (data) => {
        this.comunicados = data;
        this.loadingComunicados = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingComunicados = false;
      }
    });
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

  scrollToSection(sectionId: string): void {
    this.showMobileMenu = false;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }




  abrirLogin(portal: 'personal' | 'padres' | 'portal'): void {
    this.router.navigate(['/ingresar']);
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