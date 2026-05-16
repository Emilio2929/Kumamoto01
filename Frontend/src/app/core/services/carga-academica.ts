import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HorarioDto {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}

export interface CargaAcademicaDetalleDto {
  id: number;
  cursoId: number;
  cursoNombre: string;
  aulaId: number;
  gradoNombre: string;
  seccionLetra: string;
  aulaDescripcion: string | null;
  docenteId: number | null;
  docenteNombre: string | null;
  periodoLectivo: string | null;
  estado: number;
  horarios: HorarioDto[];
}

export interface AsignarDocenteDto {
  docenteId: number | null;
  periodoLectivo: string | null;
  horarios: HorarioDto[];
}

export interface DocenteComboItem {
  id: number;
  nombreCompleto: string;
}

@Injectable({ providedIn: 'root' })
export class CargaAcademicaService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/carga-academica`;

  getAll(): Observable<CargaAcademicaDetalleDto[]> {
    return this.http.get<CargaAcademicaDetalleDto[]>(this.api);
  }

  getDocentesCombo(): Observable<DocenteComboItem[]> {
    return this.http.get<DocenteComboItem[]>(`${environment.apiUrl}/api/docentes/combo`);
  }

  asignarDocente(id: number, dto: AsignarDocenteDto): Observable<void> {
    return this.http.patch<void>(`${this.api}/${id}/asignar`, dto);
  }

  quitarDocente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}/docente`);
  }
}
