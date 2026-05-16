import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AulaAsignadaDetalleDto {
  asignacionId: number;
  aulaId: number;
  gradoNombre: string;
  seccionLetra: string;
  aulaDescripcion: string | null;
  periodoLectivo: string | null;
}

export interface AuxiliarAsignacionesGroupDto {
  auxiliarId: number;
  auxiliarNombre: string;
  aulas: AulaAsignadaDetalleDto[];
}

export interface BulkAsignarAuxiliarDto {
  auxiliarId: number;
  aulaIds: number[];
  periodoLectivo: string;
}

@Injectable({ providedIn: 'root' })
export class AsignacionAuxiliarService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/asignacion-auxiliar`;

  getGrouped(): Observable<AuxiliarAsignacionesGroupDto[]> {
    return this.http.get<AuxiliarAsignacionesGroupDto[]>(`${this.apiBase}/grouped`);
  }

  bulkAsignar(dto: BulkAsignarAuxiliarDto): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/bulk`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
