import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardKpisDto {
  totalAlumnos: number;
  asistenciaHoy: number;
  riesgoMedio: number;
  riesgoAlto: number;
}

export interface AsistenciaGlobalDto {
  grado: string;
  label: string;
  porcentajePresente: number;
  porcentajeTarde: number;
  porcentajeFalta: number;
  totalRegistros: number;
}

export interface RiskMonitorAIDto {
  totalAlertas: number;
  riesgoAlto: number;
  riesgoMedio: number;
}

export interface RiskMonitorDetailDto {
  id: number;
  dni: string;
  estudiante: string;
  grado: string;
  seccion: string;
  tutor: string;
  nivelRiesgo: string;
  motivo: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/dashboard`;

  getKpis(): Observable<DashboardKpisDto> {
    return this.http.get<DashboardKpisDto>(`${this.apiBase}/kpis`);
  }

  getAsistenciaGlobal(filtro: string): Observable<AsistenciaGlobalDto[]> {
    return this.http.get<AsistenciaGlobalDto[]>(`${this.apiBase}/asistencia-global?filtro=${filtro}`);
  }

  getRiskMonitorAI(): Observable<RiskMonitorAIDto> {
    return this.http.get<RiskMonitorAIDto>(`${this.apiBase}/risk-monitor-ai`);
  }

  getRiskMonitorAIDetails(): Observable<RiskMonitorDetailDto[]> {
    return this.http.get<RiskMonitorDetailDto[]>(`${this.apiBase}/risk-monitor-ai/details`);
  }

  notifyRiskParent(estudianteId: number, motivo: string, nivelRiesgo: string): Observable<any> {
    return this.http.post(`${this.apiBase}/risk-monitor-ai/notify/${estudianteId}`, { motivo, nivelRiesgo });
  }

  getLibretaDirectora(estudianteId: number): Observable<any> {
    return this.http.get<any>(`${this.apiBase}/libreta/${estudianteId}`);
  }
}
