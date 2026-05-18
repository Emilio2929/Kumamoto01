import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClaseHoy {
  cargaId: number;
  curso: string;
  grado: string;
  seccion: string;
  horaInicio: string;
  horaFin: string;
}

export interface EstudianteSimple {
  id: number;
  nombreCompleto: string;
}

@Injectable({ providedIn: 'root' })
export class DocenteService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/docente-portal`;

  getClasesHoy(): Observable<ClaseHoy[]> {
    return this.http.get<ClaseHoy[]>(`${this.api}/clases-hoy`);
  }

  getEstudiantesCarga(cargaId: number): Observable<EstudianteSimple[]> {
    return this.http.get<EstudianteSimple[]>(`${this.api}/estudiantes-carga/${cargaId}`);
  }

  registrarAsistencia(cargaId: number, estudiantes: { estudianteId: number; valor: string }[]): Observable<any> {
    return this.http.post(`${this.api}/registrar-asistencia`, { cargaId, estudiantes });
  }

  registrarIncidencia(data: { estudianteId: number; tipoIncidencia: string; descripcion?: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/incidencias`, data);
  }
}
