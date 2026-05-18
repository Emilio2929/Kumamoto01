import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-ingresar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './ingresar.component.html',
  styleUrls: ['./ingresar.component.scss'],
})
export class IngresarComponent {
  loginForm!: FormGroup;
  cargando = false;
  mensajeError = '';

  // Estado Modal Recuperación de Contraseña
  showForgotModal = false;
  pasoRecuperacion: 1 | 2 = 1;
  correoRecuperacion = '';
  correoEnmascarado = '';
  codigoRecuperacion = '';
  nuevaPassword = '';
  cargandoRecuperacion = false;
  mensajeRecuperacion = '';
  errorRecuperacion = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
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
          const rol = (respuesta?.rol ?? '').toLowerCase();

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

  abrirModalRecuperacion() {
    this.showForgotModal = true;
    this.pasoRecuperacion = 1;
    this.correoRecuperacion = this.loginForm.get('correo')?.value || '';
    this.correoEnmascarado = '';
    this.codigoRecuperacion = '';
    this.nuevaPassword = '';
    this.mensajeRecuperacion = '';
    this.errorRecuperacion = '';
    this.cdr.markForCheck();
  }

  cerrarModalRecuperacion() {
    this.showForgotModal = false;
    this.cdr.markForCheck();
  }

  solicitarCodigo() {
    if (!this.correoRecuperacion || !this.correoRecuperacion.trim().includes('@')) {
      this.errorRecuperacion = 'Ingrese un correo electrónico institucional válido.';
      return;
    }

    this.cargandoRecuperacion = true;
    this.errorRecuperacion = '';
    this.mensajeRecuperacion = '';
    this.cdr.markForCheck();

    this.authService.forgotPassword(this.correoRecuperacion.trim()).subscribe({
      next: (res: any) => {
        this.cargandoRecuperacion = false;
        this.pasoRecuperacion = 2;
        this.correoEnmascarado = res.correoEnmascarado || '';
        this.mensajeRecuperacion = res.mensaje || 'Código de verificación enviado exitosamente.';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargandoRecuperacion = false;
        this.errorRecuperacion = err.error?.mensaje || 'No se pudo procesar la solicitud.';
        this.cdr.markForCheck();
      }
    });
  }

  restablecerPassword() {
    if (!this.codigoRecuperacion || !this.nuevaPassword || this.nuevaPassword.trim().length < 4) {
      this.errorRecuperacion = 'Ingrese el código de verificación y una nueva contraseña (mínimo 4 caracteres).';
      return;
    }

    this.cargandoRecuperacion = true;
    this.errorRecuperacion = '';
    this.mensajeRecuperacion = '';
    this.cdr.markForCheck();

    this.authService.resetPassword(
      this.correoRecuperacion.trim(),
      this.codigoRecuperacion.trim(),
      this.nuevaPassword.trim()
    ).subscribe({
      next: (res: any) => {
        this.cargandoRecuperacion = false;
        this.showForgotModal = false;
        this.mensajeError = '';
        alert(res.mensaje || 'Contraseña restablecida correctamente. Ya puede iniciar sesión.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargandoRecuperacion = false;
        this.errorRecuperacion = err.error?.mensaje || 'El código es incorrecto o ha expirado.';
        this.cdr.markForCheck();
      }
    });
  }
}
