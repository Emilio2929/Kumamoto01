import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EstudianteDetalleDto {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
  aulaId: number | null;
  gradoNombre: string | null;
  seccionLetra: string | null;
  aulaDescripcion: string | null;
  padreId: number | null;
  padreNombre: string | null;
  padreCorreo: string | null;
  estado: number;
}

export interface CreateEstudianteDto {
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
  aulaId: number | null;
  padreId: number | null;
}

export interface UpdateEstudianteDto {
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
  aulaId: number | null;
  padreId: number | null;
}

export interface PadreDetalleDto {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
  estado: number;
}

export interface PadreComboDto {
  id: number;
  nombreCompleto: string;
  correo: string | null;
}

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/matricula`;

  getAll(): Observable<EstudianteDetalleDto[]> {
    return this.http.get<EstudianteDetalleDto[]>(this.api);
  }

  getPadresCombo(): Observable<PadreComboDto[]> {
    return this.http.get<PadreComboDto[]>(`${this.api}/padres-combo`);
  }

  buscarPadrePorDni(dni: string): Observable<PadreDetalleDto> {
    return this.http.get<PadreDetalleDto>(
      `${environment.apiUrl}/api/padres/buscar?dni=${dni.trim()}`
    );
  }

  create(dto: CreateEstudianteDto): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.api, dto);
  }

  update(id: number, dto: UpdateEstudianteDto): Observable<void> {
    return this.http.put<void>(`${this.api}/${id}`, dto);
  }

  toggleEstado(id: number): Observable<{ estado: number }> {
    return this.http.patch<{ estado: number }>(`${this.api}/${id}/estado`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
