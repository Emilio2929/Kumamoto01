import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { PadresService } from '../../../../../core/services/padres';
import { PadreStateService } from '../../../../../core/services/padre-state.service';

@Component({
  selector: 'app-incidencias-padre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './incidencias-padre.html',
  styleUrls: ['./incidencias-padre.scss']
})
export class IncidenciasPadresComponent implements OnInit {
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
}
