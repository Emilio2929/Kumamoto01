import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PadreDetalleDto {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
  estado: number;
}

export interface CreatePadreDto {
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
}

export interface UpdatePadreDto {
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
}

export interface CreatePadreResponse {
  id: number;
  correo: string;
  claveGenerada: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class PadresService {
  private http = inject(HttpClient);
  private api = 'http://localhost:5121/api/padres';

  getAll(): Observable<PadreDetalleDto[]> {
    return this.http.get<PadreDetalleDto[]>(this.api);
  }

  create(dto: CreatePadreDto): Observable<CreatePadreResponse> {
    return this.http.post<CreatePadreResponse>(this.api, dto);
  }

  update(id: number, dto: UpdatePadreDto): Observable<void> {
    return this.http.put<void>(`${this.api}/${id}`, dto);
  }

  cambiarClave(id: number, nuevaClave: string): Observable<void> {
    return this.http.patch<void>(`${this.api}/${id}/clave`, { nuevaClave });
  }

  toggleEstado(id: number): Observable<{ estado: number }> {
    return this.http.patch<{ estado: number }>(`${this.api}/${id}/estado`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  // --- PORTAL PADRES ---

  getResumenHijo(): Observable<any> {
    return this.http.get<any>(`${this.api}/me/estudiante/resumen`);
  }

  getLibretaHijo(idEstudiante: number): Observable<any> {
    return this.http.get<any>(`${this.api}/libreta/${idEstudiante}`);
  }

  getAsistenciasHijo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/me/estudiante/asistencias`);
  }

  getDashboardCompleto(dni: string): Observable<any> {
    return this.http.get<any>(`http://localhost:5121/api/parent/dashboard/${dni}`);
  }
}
