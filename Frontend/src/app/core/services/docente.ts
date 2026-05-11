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
  private api = 'http://localhost:5121/api/docente-portal';

  getClasesHoy(): Observable<ClaseHoy[]> {
    return this.http.get<ClaseHoy[]>(`${this.api}/clases-hoy`);
  }

  getEstudiantesCarga(cargaId: number): Observable<EstudianteSimple[]> {
    return this.http.get<EstudianteSimple[]>(`${this.api}/estudiantes-carga/${cargaId}`);
  }

  registrarAsistencia(cargaId: number, estudiantes: { estudianteId: number; valor: string }[]): Observable<any> {
    return this.http.post(`${this.api}/registrar-asistencia`, { cargaId, estudiantes });
  }
}
