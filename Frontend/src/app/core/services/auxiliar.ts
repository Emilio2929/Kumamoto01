import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type EstadoAsistenciaHoy = 'Pendiente' | 'RegistradaAuxiliar' | 'RegistradaDocente';

export interface CursoHoyDto {
  cargaId: number;
  nombre: string;
  horario: string;
  esActual: boolean;
}

export interface AulaAsignadaAuxiliarDto {
  asignacionAuxiliarId: number;
  aulaId: number;
  gradoNombre: string;
  seccionLetra: string;
  aulaDescripcion: string | null;
  cursosHoy: CursoHoyDto[];
  estadoAsistenciaHoy: EstadoAsistenciaHoy;
}

export interface AsistenciaAlumnoHoyDto {
  estudianteId: number;
  nombres: string;
  apellidos: string;
  valor: string | null; // P/F/T/J
}

export interface AsistenciaHoyResponse {
  bloqueadaPorDocente: boolean;
  alumnos: AsistenciaAlumnoHoyDto[];
  fueraDeHorario: boolean;
  cursoActual: string | null;
  horarioClase: string | null;
}

export interface GuardarAsistenciaAulaItemDto {
  estudianteId: number;
  valor: string; // P/F/T/J
}

export interface GuardarAsistenciaAulaRequest {
  cargaId: number;
  items: GuardarAsistenciaAulaItemDto[];
}

@Injectable({ providedIn: 'root' })
export class AuxiliarService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:5121/api/auxiliar';
  private readonly apiPortal = 'http://localhost:5121/api/auxiliar-portal';

  getMisAulas(): Observable<AulaAsignadaAuxiliarDto[]> {
    return this.http.get<AulaAsignadaAuxiliarDto[]>(`${this.apiBase}/me/aulas`);
  }

  getAsistenciaHoy(aulaId: number, cargaId?: number): Observable<AsistenciaHoyResponse> {
    let url = `${this.apiBase}/aulas/${aulaId}/asistencia/hoy`;
    if (cargaId) url += `?cargaId=${cargaId}`;
    return this.http.get<AsistenciaHoyResponse>(url);
  }

  guardarAsistenciaAula(aulaId: number, payload: GuardarAsistenciaAulaRequest): Observable<void> {
    return this.http.post<void>(`${this.apiBase}/aulas/${aulaId}/asistencia`, payload);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiPortal}/dashboard-stats`);
  }

  getReporteAsistencia(aulaId: number, inicio?: string, fin?: string, cargaId?: number | null): Observable<any> {
    let params = `?aulaId=${aulaId}`;
    if (inicio) params += `&inicio=${inicio}`;
    if (fin) params += `&fin=${fin}`;
    if (cargaId) params += `&cargaId=${cargaId}`;
    return this.http.get<any>(`${this.apiPortal}/reporte-asistencia/${aulaId}${params}`);
  }

  getCursosByAula(aulaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPortal}/aulas/${aulaId}/cursos`);
  }
}

