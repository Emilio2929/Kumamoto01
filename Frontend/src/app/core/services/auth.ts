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

  private guardarSesion(response: LoginResponse): void {
    localStorage.setItem('kumamoto_jwt', response.token);
    localStorage.setItem(
      'kumamoto_user',
      JSON.stringify({
        nombre: `${response.nombres} ${response.apellidos}`,
        rol: response.rol,
        dni: response.dni
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

  obtenerUsuario(): { nombre: string; rol: string; dni: string } | null {
    const raw = localStorage.getItem('kumamoto_user');
    return raw ? JSON.parse(raw) : null;
  }

  obtenerDni(): string | null {
    return this.obtenerUsuario()?.dni || null;
  }

  obtenerUsuarioIdDesdeToken(): number | null {
    const token = this.obtenerToken();
    if (!token) return null;

    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return null;

      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const json = atob(padded);
      const payload = JSON.parse(json) as { sub?: string };
      const sub = payload.sub ? Number(payload.sub) : NaN;
      return Number.isFinite(sub) ? sub : null;
    } catch {
      return null;
    }
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
}