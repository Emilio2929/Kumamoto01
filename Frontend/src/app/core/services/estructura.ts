import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface AulaDto {
  id: number;
  label: string; // "1ro Primaria – A"
}

export interface AulaDetalleDto {
  id: number;
  gradoNombre: string;
  seccionLetra: string;
  descripcion: string | null;
  capacidad: number;
  gradoId: number;
  seccionId: number;
  estado: number; // 1 = activo, 0 = inactivo
}

export interface CreateAulaDto {
  gradoId: number;
  seccionId: number;
  descripcion: string | null;
  capacidad: number;
}

export interface UpdateAulaDto {
  gradoId: number;
  seccionId: number;
  descripcion: string | null;
  capacidad: number;
}

export interface GradoSimpleDto {
  id: number;
  nombre: string;
}

export interface SeccionSimpleDto {
  id: number;
  letra: string;
}

export interface DropdownsDto {
  grados: GradoSimpleDto[];
  secciones: SeccionSimpleDto[];
}

export interface SeccionDto {
  id: number;
  nombre: string;
}

export interface GradoConSeccionesDto {
  gradoId: number;
  gradoNombre: string;
  secciones: SeccionDto[];
}

export interface GradoDetalleDto {
  id: number;
  nombre: string;
  estado: number;
}

export interface SeccionDetalleDto {
  id: number;
  letra: string;
  estado: number;
}

export interface AulaAsignadaDto {
  cargaId: number;
  aulaId: number;
  gradoNombre: string;
  seccionLetra: string;
  descripcion: string | null;
}

export interface CursoDetalleDto {
  id: number;
  nombre: string;
  estado: number;
  aulas: AulaAsignadaDto[];
}

export interface CursoComboDto {
  id: number;
  nombre: string;
}

// ── Service ────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class EstructuraService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:5121/api';

  // ─ Lista completa de aulas (activas + inactivas)
  getAulasDetalle(): Observable<AulaDetalleDto[]> {
    return this.http.get<AulaDetalleDto[]>(`${this.apiBase}/aulas`);
  }

  // ─ Lista plana para combos externos (solo activas)
  getAulasCombo(): Observable<AulaDto[]> {
    return this.http.get<AulaDto[]>(`${this.apiBase}/aulas/combo`);
  }

  // ─ Dropdowns (grados y secciones para formularios)
  getDropdowns(): Observable<DropdownsDto> {
    return this.http.get<DropdownsDto>(`${this.apiBase}/aulas/dropdowns`);
  }

  // ─ Jerarquía grados → secciones
  getGradosConSecciones(): Observable<GradoConSeccionesDto[]> {
    return this.http.get<GradoConSeccionesDto[]>(`${this.apiBase}/aulas/grados`);
  }

  // ─ Crear aula
  createAula(dto: CreateAulaDto): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiBase}/aulas`, dto);
  }

  // ─ Editar aula
  updateAula(id: number, dto: UpdateAulaDto): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/aulas/${id}`, dto);
  }

  // ─ Toggle activo/inactivo
  toggleEstado(id: number): Observable<{ estado: number }> {
    return this.http.patch<{ estado: number }>(`${this.apiBase}/aulas/${id}/estado`, {});
  }

  // ─ Eliminación lógica
  deleteAula(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/aulas/${id}`);
  }

  // ══════════════════════════════════════════════════════
  //  GRADOS
  // ══════════════════════════════════════════════════════

  getGrados(): Observable<GradoDetalleDto[]> {
    return this.http.get<GradoDetalleDto[]>(`${this.apiBase}/grados`);
  }

  createGrado(nombre: string): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiBase}/grados`, { nombre });
  }

  updateGrado(id: number, nombre: string): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/grados/${id}`, { nombre });
  }

  toggleGradoEstado(id: number): Observable<{ estado: number }> {
    return this.http.patch<{ estado: number }>(`${this.apiBase}/grados/${id}/estado`, {});
  }

  deleteGrado(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/grados/${id}`);
  }

  // ══════════════════════════════════════════════════════
  //  SECCIONES
  // ══════════════════════════════════════════════════════

  getSecciones(): Observable<SeccionDetalleDto[]> {
    return this.http.get<SeccionDetalleDto[]>(`${this.apiBase}/secciones`);
  }

  createSeccion(letra: string): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiBase}/secciones`, { letra });
  }

  updateSeccion(id: number, letra: string): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/secciones/${id}`, { letra });
  }

  toggleSeccionEstado(id: number): Observable<{ estado: number }> {
    return this.http.patch<{ estado: number }>(`${this.apiBase}/secciones/${id}/estado`, {});
  }

  deleteSeccion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/secciones/${id}`);
  }

  // ══════════════════════════════════════════════════════
  //  CURSOS
  // ══════════════════════════════════════════════════════

  getCursos(): Observable<CursoDetalleDto[]> {
    return this.http.get<CursoDetalleDto[]>(`${this.apiBase}/cursos`);
  }

  getCursosCombo(): Observable<CursoComboDto[]> {
    return this.http.get<CursoComboDto[]>(`${this.apiBase}/cursos/combo`);
  }

  createCurso(nombre: string): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiBase}/cursos`, { nombre });
  }

  updateCurso(id: number, nombre: string): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/cursos/${id}`, { nombre });
  }

  toggleCursoEstado(id: number): Observable<{ estado: number }> {
    return this.http.patch<{ estado: number }>(`${this.apiBase}/cursos/${id}/estado`, {});
  }

  deleteCurso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/cursos/${id}`);
  }

  asignarAulaACurso(cursoId: number, aulaId: number): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiBase}/cursos/${cursoId}/asignar`, { aulaId });
  }

  removerAsignacionCurso(cargaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/cursos/asignaciones/${cargaId}`);
  }
}

