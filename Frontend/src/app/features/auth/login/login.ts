import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  cargando = false;
  mensajeError = '';

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router 
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
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
          this.cargando = false;
          // El API devuelve { token, nombres, apellidos, rol }
          const rol = (respuesta?.rol ?? '').toLowerCase();
          if (rol === 'director') {
            this.router.navigate(['/dashboard/directora']);
          } else if (rol === 'docente') {
            this.router.navigate(['/dashboard/docente']);
          } else if (rol === 'padre') {
            this.router.navigate(['/dashboard/padre']);
          } else if (rol === 'auxiliar') {
            this.router.navigate(['/dashboard/auxiliar']);
          } else {
            this.router.navigate(['/dashboard/directora']);
          }
        },
        error: () => {
          this.cargando = false;
          this.mensajeError = 'Credenciales incorrectas. Intenta de nuevo.';
        }
      });
    }
  }
}