import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdministrativoDetalleDto {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  correoPersonal: string | null;
  telefono: string | null;
  estado: number;
}

export interface CreateAdministrativoDto {
  dni: string;
  nombres: string;
  apellidos: string;
  correoPersonal: string | null;
  telefono: string | null;
}

export interface UpdateAdministrativoDto {
  nombres: string;
  apellidos: string;
  correoPersonal: string | null;
  telefono: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdministrativosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/administrativos`;

  getAll(): Observable<AdministrativoDetalleDto[]> {
    return this.http.get<AdministrativoDetalleDto[]>(this.apiUrl);
  }

  create(dto: CreateAdministrativoDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateAdministrativoDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto);
  }

  cambiarClave(id: number, nuevaClave: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/clave`, { nuevaClave });
  }

  toggleEstado(id: number): Observable<{ estado: number }> {
    return this.http.patch<{ estado: number }>(`${this.apiUrl}/${id}/estado`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
