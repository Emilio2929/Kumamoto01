import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-ingresar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './ingresar.component.html',
  styleUrls: ['./ingresar.component.scss'],
})
export class IngresarComponent {
  loginForm!: FormGroup;
  cargando = false;
  mensajeError = '';

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
}
