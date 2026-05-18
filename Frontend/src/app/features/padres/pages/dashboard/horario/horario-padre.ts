import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { PadresService } from '../../../../../core/services/padres';
import { PadreStateService } from '../../../../../core/services/padre-state.service';

@Component({
  selector: 'app-horario-padre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horario-padre.html',
  styleUrls: ['./horario-padre.scss']
})
export class HorarioPadresComponent implements OnInit {
  private padresService = inject(PadresService);
  public stateService = inject(PadreStateService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  horarioData: any = null;
  horasUnicas: string[] = [];
  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  cursoColores: { [curso: string]: string } = {};
  paletaCorporativa = [
    'corp-blue',
    'corp-indigo',
    'corp-slate',
    'corp-sky',
    'corp-cyan',
    'corp-emerald'
  ];

  ngOnInit() {
    this.stateService.hijoSeleccionado$.subscribe({
      next: (hijo: any) => {
        if (hijo && hijo.id) {
          this.cargarHorario(hijo.id);
        } else {
          this.padresService.getResumenHijo().subscribe({
            next: (resumen: any) => {
              if (resumen && resumen.id) {
                this.cargarHorario(resumen.id);
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

  cargarHorario(idEstudiante: number) {
    this.loading = true;
    this.padresService.getHorarioHijo(idEstudiante).subscribe({
      next: (data: any) => {
        this.procesarHorario(data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  procesarHorario(data: any) {
    this.horarioData = data;
    this.cursoColores = {};
    this.horasUnicas = [];

    if (!data || !data.horario) return;

    const setHoras = new Set<string>();
    let colorIndex = 0;

    data.horario.forEach((diaObj: any) => {
      if (diaObj.clases) {
        diaObj.clases.forEach((c: any) => {
          if (c.horaInicio) setHoras.add(c.horaInicio);
          if (c.curso && !this.cursoColores[c.curso]) {
            this.cursoColores[c.curso] = this.paletaCorporativa[colorIndex % this.paletaCorporativa.length];
            colorIndex++;
          }
        });
      }
    });

    this.horasUnicas = Array.from(setHoras).sort((a, b) => a.localeCompare(b));
  }

  getClase(dia: string, horaInicio: string): any {
    if (!this.horarioData || !this.horarioData.horario) return null;
    const diaObj = this.horarioData.horario.find((h: any) => h.dia === dia);
    if (!diaObj || !diaObj.clases) return null;
    return diaObj.clases.find((c: any) => c.horaInicio === horaInicio) || null;
  }

  imprimirHorario() {
    window.print();
  }
}
