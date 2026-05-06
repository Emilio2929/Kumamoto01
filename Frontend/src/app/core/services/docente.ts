import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClaseActualResponse {
  activa: boolean;
  mensaje?: string;
  cargaId?: number;
  aulaId?: number;
  curso?: string;
  grado?: string;
  seccion?: string;
  estudiantes?: { id: number; nombreCompleto: string }[];
}

@Injectable({ providedIn: 'root' })
export class DocenteService {
  private http = inject(HttpClient);
  private api = 'http://localhost:5121/api/docentes/portal';

  getClaseActual(): Observable<ClaseActualResponse> {
    return this.http.get<ClaseActualResponse>(`${this.api}/clase-actual`);
  }

  registrarAsistencia(cargaId: number, estudiantes: { estudianteId: number; presente: boolean }[]): Observable<any> {
    return this.http.post(`${this.api}/registrar-asistencia`, { cargaId, estudiantes });
  }
}
