import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { PadresService } from '../../../../core/services/padres';
import { PadreStateService } from '../../../../core/services/padre-state.service';

@Component({
  selector: 'app-notas-padre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notas-padre.html',
  styleUrls: ['./notas-padre.scss']
})
export class NotasPadresComponent implements OnInit {
  private padresService = inject(PadresService);
  public stateService = inject(PadreStateService);
  private cdr = inject(ChangeDetectorRef);
  loading = true;
  libreta: any = null;

  bimestreSeleccionado: string = '';
  semanasNumeros: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  ngOnInit() {
    this.stateService.hijoSeleccionado$.subscribe({
      next: (hijo: any) => {
        if(hijo && hijo.id) {
           this.loading = true;
           this.padresService.getLibretaHijo(hijo.id).subscribe({
              next: (data) => {
                 this.libreta = data;
                 if (this.libreta && this.libreta.historial && this.libreta.historial.length > 0) {
                   this.bimestreSeleccionado = this.libreta.historial[0].bimestre;
                 }
                 this.loading = false;
                 this.cdr.detectChanges();
              },
              error: () => {
                 this.loading = false;
                 this.cdr.detectChanges();
              }
           });
        } else {
           // Fallback por si entran directo sin pasar por el dashboard
           this.padresService.getResumenHijo().subscribe({
             next: (resumen) => {
               if(resumen && resumen.id) {
                  this.padresService.getLibretaHijo(resumen.id).subscribe({
                     next: (data) => {
                        this.libreta = data;
                        if (this.libreta && this.libreta.historial && this.libreta.historial.length > 0) {
                          this.bimestreSeleccionado = this.libreta.historial[0].bimestre;
                        }
                        this.loading = false;
                        this.cdr.detectChanges();
                     },
                     error: () => {
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

  getBimestres(): string[] {
    if (!this.libreta || !this.libreta.historial) return [];
    return this.libreta.historial.map((h: any) => h.bimestre);
  }

  seleccionarBimestre(bim: string) {
    this.bimestreSeleccionado = bim;
  }

  getCursosBimestre(): any[] {
    if (!this.libreta || !this.libreta.historial) return [];
    const bim = this.libreta.historial.find((h: any) => h.bimestre === this.bimestreSeleccionado);
    return bim ? bim.cursos : [];
  }

  getNotaSemana(competencia: any, numSemana: number): string {
    if (!competencia || !competencia.semanas) return '-';
    const s = competencia.semanas.find((x: any) => x.semana === `Semana ${numSemana}`);
    return s ? s.nota : '-';
  }

  getBadgeClass(nota: string): string {
    const n = (nota || '').toUpperCase().trim();
    if (n === 'C') return 'nota-c';
    if (n === 'B') return 'nota-b';
    if (n === 'A' || n === 'AD') return 'nota-a';
    return '';
  }

  descargarLibreta() {
    window.print();
  }
}
