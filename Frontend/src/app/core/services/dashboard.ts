import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardKpisDto {
  totalAlumnos: number;
  asistenciaHoy: number;
  riesgoMedio: number;
  riesgoAlto: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:5121/api/dashboard';

  getKpis(): Observable<DashboardKpisDto> {
    return this.http.get<DashboardKpisDto>(`${this.apiBase}/kpis`);
  }
}
