import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PadresService } from './padres';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class PadreStateService {
  private padresService = inject(PadresService);
  private authService = inject(AuthService);

  private hijosSubject = new BehaviorSubject<any[]>([]);
  hijos$ = this.hijosSubject.asObservable();

  private hijoSeleccionadoSubject = new BehaviorSubject<any>(null);
  hijoSeleccionado$ = this.hijoSeleccionadoSubject.asObservable();

  loading = new BehaviorSubject<boolean>(false);

  cargarHijos() {
    const dni = this.authService.obtenerDni();
    if (!dni) return;

    this.loading.next(true);
    this.padresService.getDashboardCompleto(dni).subscribe({
      next: (data) => {
        this.hijosSubject.next(data.hijos);
        if (data.hijos.length > 0 && !this.hijoSeleccionadoSubject.value) {
          this.hijoSeleccionadoSubject.next(data.hijos[0]);
        }
        this.loading.next(false);
      },
      error: () => this.loading.next(false)
    });
  }

  seleccionarHijo(hijo: any) {
    this.hijoSeleccionadoSubject.next(hijo);
  }

  getHijoSeleccionado() {
    return this.hijoSeleccionadoSubject.value;
  }
}
