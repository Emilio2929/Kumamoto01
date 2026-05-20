import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Competencia {
  id: number;
  codigo: string;
  nombre: string;
}

export interface NotaCeldaDto {
  valor: string | null;
  bloqueado: boolean;
}

export interface AlumnoPlanilla {
  estudianteId: number;
  nombreCompleto: string;
  tieneAlerta: boolean;
  notas: Record<string, NotaCeldaDto>;
}

export interface PlanillaResponse {
  competencias: Competencia[];
  alumnos: AlumnoPlanilla[];
}

export interface NotaItem {
  estudianteId: number;
  competenciaId: number;
  nota: string;
}

export interface BulkSaveRequest {
  cargaId: number;
  semanaId: number;
  notas: NotaItem[];
}

export interface SemanaAcademica {
  id: number;
  numeroSemana: number;
}

export interface PeriodoAcademico {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estaCerrado: boolean;
  semanas: SemanaAcademica[];
}

export interface EscalaCalificacion {
  id: number;
  letra: string;
  descripcion: string;
  requiereIntervencion: boolean;
}

export interface CalificacionesConfig {
  periodos: PeriodoAcademico[];
  escalas: EscalaCalificacion[];
}

export interface CargaDocente {
  cargaId: number;
  curso: string;
  grado: string;
  seccion: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalificacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/calificaciones`;

  getMisCursos(): Observable<CargaDocente[]> {
    return this.http.get<CargaDocente[]>(`${this.apiUrl}/mis-cursos`);
  }

  getCompetencias(cargaId: number): Observable<Competencia[]> {
    return this.http.get<Competencia[]>(`${this.apiUrl}/competencias/carga/${cargaId}`);
  }

  createCompetencia(cargaId: number, codigo: string, nombre: string): Observable<Competencia> {
    return this.http.post<Competencia>(`${this.apiUrl}/competencias`, { cargaId, codigo, nombre });
  }

  deleteCompetencia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/competencias/${id}`);
  }

  getCompetenciasAdmin(cursoId: number, gradoId: number): Observable<Competencia[]> {
    return this.http.get<Competencia[]>(`${this.apiUrl}/competencias/admin/curso/${cursoId}/grado/${gradoId}`);
  }

  createCompetenciaAdmin(cursoId: number, gradoId: number, codigo: string, nombre: string): Observable<Competencia> {
    return this.http.post<Competencia>(`${this.apiUrl}/competencias/admin`, { cursoId, gradoId, codigo, nombre });
  }

  deleteCompetenciaAdmin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/competencias/admin/${id}`);
  }

  updateCompetenciaAdmin(id: number, codigo: string, nombre: string): Observable<Competencia> {
    return this.http.put<Competencia>(`${this.apiUrl}/competencias/admin/${id}`, { codigo, nombre });
  }

  getConfig(): Observable<CalificacionesConfig> {
    return this.http.get<CalificacionesConfig>(`${this.apiUrl}/config`);
  }

  getPlanilla(cargaId: number, semanaId: number, competenciasIds: string): Observable<PlanillaResponse> {
    return this.http.get<PlanillaResponse>(`${this.apiUrl}/planilla?cargaId=${cargaId}&semanaId=${semanaId}&competenciasIds=${competenciasIds}`);
  }

  bulkSave(data: BulkSaveRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk-save`, data);
  }

  getReporteBimestral(cargaId: number, periodoId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reporte/${cargaId}?periodoId=${periodoId}`);
  }
}
