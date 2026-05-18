import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuxiliarService, AulaAsignadaAuxiliarDto } from '../../../../core/services/auxiliar';

@Component({
  selector: 'app-dashboard-auxiliar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-auxiliar.html',
  styleUrl: './dashboard-auxiliar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardAuxiliarComponent implements OnInit {
  private auxiliarService = inject(AuxiliarService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  stats: any = null;
  loading = true;
  error = false;

  aulas: AulaAsignadaAuxiliarDto[] = [];
  selectedAulaId: number | null = null;
  
  cursosAula: any[] = [];
  selectedCargaId: number | null = null;

  aulaStats: any = null;
  loadingAulaStats = false;

  ngOnInit() {
    this.cargarStats();
    this.cargarAulas();
  }

  cargarStats() {
    this.loading = true;
    this.auxiliarService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarAulas() {
    this.auxiliarService.getMisAulas().subscribe({
      next: (data) => {
        this.aulas = data;
        if (this.aulas.length > 0) {
          this.selectedAulaId = this.aulas[0].aulaId;
          this.selectedCargaId = null;
          this.cargarAulaDetalle(this.selectedAulaId, true);
        }
        this.cdr.detectChanges();
      }
    });
  }

  onAulaSelectChange() {
    if (this.selectedAulaId) {
      this.selectedCargaId = null;
      this.cargarAulaDetalle(this.selectedAulaId, true);
    }
  }

  onCargaSelectChange() {
    if (this.selectedAulaId) {
      this.cargarAulaDetalle(this.selectedAulaId, false);
    }
  }

  cargarAulaDetalle(aulaId: number, recargarCursos: boolean = false) {
    this.loadingAulaStats = true;
    this.aulaStats = null;
    this.cdr.detectChanges();

    // Consultar los últimos 30 días para asegurar que haya datos de muestra
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const finStr = today.toISOString().split('T')[0];
    const inicioStr = thirtyDaysAgo.toISOString().split('T')[0];

    const cargaParam = this.selectedCargaId ? this.selectedCargaId : null;

    this.auxiliarService.getReporteAsistencia(aulaId, inicioStr, finStr, cargaParam).subscribe({
      next: (data) => {
        const records = data.asistencias || [];
        const students = data.estudiantes || [];
        if (recargarCursos) {
          this.cursosAula = data.cursos || [];
        }

        // Buscar la última fecha que tenga registros para determinar la semana activa
        let fechaReferencia = new Date();
        if (records.length > 0) {
          const fechas = Array.from(new Set(records.map((r: any) => r.fecha))).sort().reverse();
          if (fechas.length > 0) {
            fechaReferencia = new Date(fechas[0] + 'T00:00:00');
          }
        }

        // Calcular Lunes a Viernes de esa semana de referencia
        const dayOfWeek = fechaReferencia.getDay() || 7;
        const monday = new Date(fechaReferencia);
        monday.setDate(fechaReferencia.getDate() - (dayOfWeek - 1));

        const diasSemana = [];
        const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

        for (let i = 0; i < 5; i++) {
          const currentDay = new Date(monday);
          currentDay.setDate(monday.getDate() + i);
          const dateStr = currentDay.toISOString().split('T')[0];
          const descFecha = `${currentDay.getDate()}/${currentDay.getMonth() + 1}`;

          const dayRecords = records.filter((r: any) => r.fecha === dateStr);
          const p = dayRecords.filter((r: any) => r.valor === 'P').length;
          const f = dayRecords.filter((r: any) => r.valor === 'F').length;
          const t = dayRecords.filter((r: any) => r.valor === 'T').length;
          const total = p + f + t;

          diasSemana.push({
            nombre: nombresDias[i],
            fechaStr: descFecha,
            p, f, t, total,
            pctP: total > 0 ? Math.round((p / total) * 100) : 0,
            pctF: total > 0 ? Math.round((f / total) * 100) : 0,
            pctT: total > 0 ? Math.round((t / total) * 100) : 0
          });
        }

        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        const semanaRangoStr = `${monday.getDate()}/${monday.getMonth()+1}/${monday.getFullYear()} al ${friday.getDate()}/${friday.getMonth()+1}/${friday.getFullYear()}`;

        // Asistencia Acumulada (Último Mes)
        const semP = records.filter((r: any) => r.valor === 'P').length;
        const semF = records.filter((r: any) => r.valor === 'F').length;
        const semT = records.filter((r: any) => r.valor === 'T').length;
        const totalSem = semP + semF + semT;

        // Alumnos con faltas reiteradas en este periodo
        const alumnosRiesgo: any[] = [];
        students.forEach((s: any) => {
          const sAsists = records.filter((r: any) => r.estudianteId === s.id);
          const sF = sAsists.filter((r: any) => r.valor === 'F').length;
          const sT = sAsists.filter((r: any) => r.valor === 'T').length;
          if (sF >= 2 || sT >= 3) {
            alumnosRiesgo.push({
              nombre: s.nombre,
              faltas: sF,
              tardanzas: sT,
              nivel: sF >= 3 ? 'Alto' : 'Medio'
            });
          }
        });

        this.aulaStats = {
          semanaRangoStr,
          diasSemana,
          semana: {
            p: semP, f: semF, t: semT, total: totalSem,
            pctP: totalSem > 0 ? Math.round((semP / totalSem) * 100) : 0,
            pctF: totalSem > 0 ? Math.round((semF / totalSem) * 100) : 0,
            pctT: totalSem > 0 ? Math.round((semT / totalSem) * 100) : 0
          },
          alumnosRiesgo
        };

        this.loadingAulaStats = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAulaStats = false;
        this.cdr.detectChanges();
      }
    });
  }

  getRiesgoClass(riesgo: string) {
    if (riesgo === 'Alto') return 'badge-risk-high';
    if (riesgo === 'Medio') return 'badge-risk-medium';
    return 'badge-risk-low';
  }
}
