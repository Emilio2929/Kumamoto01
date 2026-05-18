import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { PadresService } from '../../../../../core/services/padres';
import { PadreStateService } from '../../../../../core/services/padre-state.service';

@Component({
  selector: 'app-asistencia-diaria',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asistencia-diaria.html',
  styleUrls: ['./asistencia-diaria.scss']
})
export class AsistenciaDiariaComponent implements OnInit {
  private padresService = inject(PadresService);
  public stateService = inject(PadreStateService);
  private cdr = inject(ChangeDetectorRef);
  
  loading = true;
  datos: any = null;

  ngOnInit() {
    this.stateService.hijoSeleccionado$.subscribe({
      next: (hijo: any) => {
        if(hijo && hijo.id) {
           this.loading = true;
           this.padresService.getAsistenciasEIncidenciasHijo(hijo.id).subscribe({
              next: (data) => {
                 this.datos = data;
                 this.loading = false;
                 this.cdr.detectChanges();
              },
              error: () => {
                 this.datos = null;
                 this.loading = false;
                 this.cdr.detectChanges();
              }
           });
        } else {
           this.padresService.getResumenHijo().subscribe({
             next: (resumen) => {
               if(resumen && resumen.id) {
                  this.padresService.getAsistenciasEIncidenciasHijo(resumen.id).subscribe({
                     next: (data) => {
                        this.datos = data;
                        this.loading = false;
                        this.cdr.detectChanges();
                     },
                     error: () => {
                        this.datos = null;
                        this.loading = false;
                        this.cdr.detectChanges();
                     }
                  });
               } else {
                  this.loading = false;
                  this.cdr.detectChanges();
               }
             },
             error: () => {
               this.loading = false;
               this.cdr.detectChanges();
             }
           });
        }
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getBadgeClass(estado: string): string {
    if (estado === 'Asistió' || estado === 'P') return 'badge-success';
    if (estado === 'Falta' || estado === 'F') return 'badge-danger';
    if (estado === 'Tardanza' || estado === 'T') return 'badge-warning';
    if (estado === 'Justificado' || estado === 'J') return 'badge-info';
    return 'badge-secondary';
  }
}
