import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { PadresService } from '../../../../core/services/padres';

@Component({
  selector: 'app-notas-padre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notas-padre.html',
  styleUrls: ['./notas-padre.scss']
})
export class NotasPadresComponent implements OnInit {
  private padresService = inject(PadresService);
  private cdr = inject(ChangeDetectorRef);
  loading = true;
  libreta: any = null;

  ngOnInit() {
    this.padresService.getResumenHijo().subscribe({
      next: (resumen) => {
        if(resumen && resumen.id) {
           this.padresService.getLibretaHijo(resumen.id).subscribe({
              next: (data) => {
                 this.libreta = data;
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

  getBimestres(): string[] {
    if (!this.libreta || !this.libreta.historial) return [];
    return this.libreta.historial.map((h: any) => h.bimestre);
  }

  getCursos(): string[] {
    if (!this.libreta || !this.libreta.historial) return [];
    const cursosSet = new Set<string>();
    this.libreta.historial.forEach((h: any) => {
      h.cursos.forEach((c: any) => cursosSet.add(c.curso));
    });
    return Array.from(cursosSet);
  }

  getNotaBimestre(curso: string, bimestre: string): string {
    if (!this.libreta || !this.libreta.historial) return '';
    const bim = this.libreta.historial.find((h: any) => h.bimestre === bimestre);
    if (!bim) return '';
    const c = bim.cursos.find((c: any) => c.curso === curso);
    return c ? c.nota : '';
  }

  descargarLibreta() {
    // Generación simple de PDF usando la función nativa del navegador
    window.print();
  }
}
