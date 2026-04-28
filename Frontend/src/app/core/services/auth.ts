import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  nombres: string;
  apellidos: string;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:5121/api';

  iniciarSesion(correo: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiBase}/auth/login`, { correo, password })
      .pipe(
        tap((response) => {
          localStorage.setItem('kumamoto_jwt', response.token);
          localStorage.setItem(
            'kumamoto_user',
            JSON.stringify({
              nombre: `${response.nombres} ${response.apellidos}`,
              rol: response.rol,
            })
          );
        })
      );
  }

  cerrarSesion(): void {
    localStorage.removeItem('kumamoto_jwt');
    localStorage.removeItem('kumamoto_user');
  }

  estaAutenticado(): boolean {
    return !!localStorage.getItem('kumamoto_jwt');
  }

  obtenerToken(): string | null {
    return localStorage.getItem('kumamoto_jwt');
  }

  obtenerUsuario(): { nombre: string; rol: string } | null {
    const raw = localStorage.getItem('kumamoto_user');
    return raw ? JSON.parse(raw) : null;
  }
}