import { environment } from '../../../environments/environment';
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
  dni: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api`;

  iniciarSesion(correo: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiBase}/auth/login`, { correo, password })
      .pipe(
        tap((response) => {
          this.guardarSesion(response);
        })
      );
  }

  iniciarSesionPadre(dniPadre: string, dniEstudiante: string) {
    // Removed
  }

  private guardarSesion(response: any): void {
    // El JWT ya viaja en la Cookie HttpOnly, solo guardamos los datos del usuario para pintar la UI.
    // Usamos sessionStorage: Al cerrar la pestaña, se destruye automáticamente.
    sessionStorage.setItem(
      'kumamoto_user',
      JSON.stringify({
        id: response.id,
        nombre: `${response.nombres} ${response.apellidos}`,
        rol: response.rol,
        dni: response.dni
      })
    );
  }

  obtenerUsuarioIdDesdeToken(): number | null {
    const raw = sessionStorage.getItem('kumamoto_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user.id ? Number(user.id) : null;
  }

  cerrarSesion(): void {
    this.http.post(`${this.apiBase}/auth/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        sessionStorage.removeItem('kumamoto_user');
      },
      error: () => {
        sessionStorage.removeItem('kumamoto_user');
      }
    });
  }

  estaAutenticado(): boolean {
    // La autenticación real la valida el backend mediante la Cookie HttpOnly en cada petición.
    // Aquí solo verificamos que la sesión del navegador exista para permitir el renderizado inicial.
    return !!sessionStorage.getItem('kumamoto_user');
  }

  obtenerUsuario(): { nombre: string; rol: string; dni: string } | null {
    const raw = sessionStorage.getItem('kumamoto_user');
    return raw ? JSON.parse(raw) : null;
  }

  obtenerDni(): string | null {
    return this.obtenerUsuario()?.dni || null;
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/auth/me`);
  }

  updateProfile(data: { correoPersonal: string; telefono: string }): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/auth/me`, data);
  }

  changePassword(data: { contrasenaActual: string; nuevaContrasena: string }): Observable<any> {
    return this.http.put<any>(`${this.apiBase}/auth/me/password`, data);
  }

  forgotPassword(correo: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/auth/forgot-password`, { correo });
  }

  resetPassword(correo: string, codigo: string, nuevaPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/auth/reset-password`, { correo, codigo, nuevaPassword });
  }
}