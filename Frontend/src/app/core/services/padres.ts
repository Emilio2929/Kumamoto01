import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface PadreDetalleDto {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  correoPersonal: string | null;
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
  private api = `${environment.apiUrl}/api/padres`;

  private resumenCache: any = null;
  private libretaCache: { [id: number]: any } = {};
  private asistenciasCache: { [id: number]: any } = {};
  private dashboardCache: { [dni: string]: any } = {};

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
    if (this.resumenCache) {
      return of(this.resumenCache);
    }
    return this.http.get<any>(`${this.api}/me/estudiante/resumen`).pipe(
      tap(data => this.resumenCache = data)
    );
  }

  getLibretaHijo(idEstudiante: number): Observable<any> {
    if (this.libretaCache[idEstudiante]) {
      return of(this.libretaCache[idEstudiante]);
    }
    return this.http.get<any>(`${this.api}/libreta/${idEstudiante}`).pipe(
      tap(data => this.libretaCache[idEstudiante] = data)
    );
  }

  getAsistenciasHijo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/me/estudiante/asistencias`);
  }

  getAsistenciasEIncidenciasHijo(idEstudiante: number): Observable<any> {
    if (this.asistenciasCache[idEstudiante]) {
      return of(this.asistenciasCache[idEstudiante]);
    }
    return this.http.get<any>(`${this.api}/asistencias/${idEstudiante}`).pipe(
      tap(data => this.asistenciasCache[idEstudiante] = data)
    );
  }

  getHorarioHijo(idEstudiante: number): Observable<any> {
    return this.http.get<any>(`${this.api}/horario/${idEstudiante}`);
  }

  getDashboardCompleto(dni: string): Observable<any> {
    if (this.dashboardCache[dni]) {
      return of(this.dashboardCache[dni]);
    }
    return this.http.get<any>(`${environment.apiUrl}/api/parent/dashboard/${dni}`).pipe(
      tap(data => this.dashboardCache[dni] = data)
    );
  }

  limpiarCachePadres() {
    this.resumenCache = null;
    this.libretaCache = {};
    this.asistenciasCache = {};
    this.dashboardCache = {};
  }
}
