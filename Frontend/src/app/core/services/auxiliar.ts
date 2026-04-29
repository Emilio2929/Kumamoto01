import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type EstadoAsistenciaHoy = 'Pendiente' | 'RegistradaAuxiliar' | 'RegistradaDocente';

export interface AulaAsignadaAuxiliarDto {
  asignacionAuxiliarId: number;
  aulaId: number;
  gradoNombre: string;
  seccionLetra: string;
  aulaDescripcion: string | null;
  cursoActual: string | null;
  horarioClase: string | null;
  enHorario: boolean;
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
  items: GuardarAsistenciaAulaItemDto[];
}

@Injectable({ providedIn: 'root' })
export class AuxiliarService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:5121/api/auxiliar';

  getMisAulas(): Observable<AulaAsignadaAuxiliarDto[]> {
    return this.http.get<AulaAsignadaAuxiliarDto[]>(`${this.apiBase}/me/aulas`);
  }

  getAsistenciaHoy(aulaId: number): Observable<AsistenciaHoyResponse> {
    return this.http.get<AsistenciaHoyResponse>(`${this.apiBase}/aulas/${aulaId}/asistencia/hoy`);
  }

  guardarAsistenciaAula(aulaId: number, payload: GuardarAsistenciaAulaRequest): Observable<void> {
    return this.http.post<void>(`${this.apiBase}/aulas/${aulaId}/asistencia`, payload);
  }
}

