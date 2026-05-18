import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificacionDto {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  fechaEnvio: string;
  leido: number;
  remitente: string;
  rolRemitente: string;
  estudiante: string | null;
  estudianteId: number | null;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/notificaciones`;

  getMisNotificaciones(): Observable<NotificacionDto[]> {
    return this.http.get<NotificacionDto[]>(`${this.api}/me`);
  }

  getContadorNoLeidas(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.api}/noread/count`);
  }

  marcarComoLeida(id: number): Observable<any> {
    return this.http.patch(`${this.api}/${id}/leer`, {});
  }

  marcarTodasComoLeidas(): Observable<any> {
    return this.http.patch(`${this.api}/leer-todas`, {});
  }

  enviarNotificacion(dto: { usuarioDestinoId: number; estudianteId?: number | null; tipo: string; titulo: string; mensaje: string }): Observable<any> {
    return this.http.post(this.api, dto);
  }
}
