import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocenteDetalleDto {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  correoPersonal: string | null;
  telefono: string | null;
  estado: number;
}

export interface CreateDocenteDto {
  dni: string;
  nombres: string;
  apellidos: string;
  correoPersonal: string | null;
  telefono: string | null;
}

export interface UpdateDocenteDto {
  nombres: string;
  apellidos: string;
  correoPersonal: string | null;
  telefono: string | null;
}

export interface CreateDocenteResponse {
  id: number;
  correo: string;
  claveGenerada: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class DocentesService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/docentes`;

  getAll(): Observable<DocenteDetalleDto[]> {
    return this.http.get<DocenteDetalleDto[]>(this.api);
  }

  create(dto: CreateDocenteDto): Observable<CreateDocenteResponse> {
    return this.http.post<CreateDocenteResponse>(this.api, dto);
  }

  update(id: number, dto: UpdateDocenteDto): Observable<void> {
    return this.http.put<void>(`${this.api}/${id}`, dto);
  }

  cambiarClave(id: number, nuevaClave: string): Observable<void> {
    return this.http.patch<void>(`${this.api}/${id}/clave`, { nuevaClave });
  }

  toggleEstado(id: number): Observable<{ estado: number }> {
    return this.http.patch<{ estado: number }>(`${this.api}/${id}/estado`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
