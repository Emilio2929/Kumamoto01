import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuxiliarDetalleDto {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  correoPersonal: string | null;
  telefono: string | null;
  estado: number;
}

export interface CreateAuxiliarDto {
  dni: string;
  nombres: string;
  apellidos: string;
  correoPersonal: string | null;
  telefono: string | null;
}

export interface UpdateAuxiliarDto {
  nombres: string;
  apellidos: string;
  correoPersonal: string | null;
  telefono: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuxiliaresAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/auxiliares-admin`;

  getAll(): Observable<AuxiliarDetalleDto[]> {
    return this.http.get<AuxiliarDetalleDto[]>(this.apiBase);
  }

  create(dto: CreateAuxiliarDto): Observable<any> {
    return this.http.post<any>(this.apiBase, dto);
  }

  update(id: number, dto: UpdateAuxiliarDto): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/${id}`, dto);
  }

  cambiarClave(id: number, nuevaClave: string): Observable<void> {
    return this.http.patch<void>(`${this.apiBase}/${id}/clave`, { nuevaClave });
  }

  toggleEstado(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiBase}/${id}/estado`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
