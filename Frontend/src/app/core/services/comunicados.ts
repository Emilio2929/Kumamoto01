import { environment } from '../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Comunicado {
  id: number;
  titulo: string;
  contenido: string;
  urlImagen?: string;
  urlArchivo?: string;
  fechaPublicacion: string;
  esImportante: boolean;
  estado: number;
}

export interface CreateComunicadoDto {
  titulo: string;
  contenido: string;
  urlImagen?: string;
  urlArchivo?: string;
  esImportante: boolean;
}

@Injectable({ providedIn: 'root' })
export class ComunicadosService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/comunicados`;

  getAll(): Observable<Comunicado[]> {
    return this.http.get<Comunicado[]>(this.api);
  }

  create(dto: CreateComunicadoDto): Observable<Comunicado> {
    return this.http.post<Comunicado>(this.api, dto);
  }

  update(id: number, dto: CreateComunicadoDto): Observable<Comunicado> {
    return this.http.put<Comunicado>(`${this.api}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
