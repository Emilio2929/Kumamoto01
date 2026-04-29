import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CrearIncidenciaRequest {
  estudianteId: number;
  tipoIncidencia: string;
  descripcion?: string | null;
}

@Injectable({ providedIn: 'root' })
export class IncidenciasService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:5121/api/incidencias';

  crearIncidencia(payload: CrearIncidenciaRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiBase}/`, payload);
  }
}

