import { Component, Input, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeriodoAcademico, CalificacionService } from '../../../../../../../core/services/calificacion.service';
import { ReportePdfService } from '../../../../../../../core/services/reporte-pdf.service';

interface PromedioEstudiante {
  estudianteId: number;
  nombreCompleto: string;
  promediosCompetencias: Record<string, string>;
  promedioBimestre: string;
  detallesSemanales: Record<string, { semanaId: number; numeroSemana: number; nota: string }[]>;
  isExpanded?: boolean;
}

interface ReporteResponse {
  competencias: { id: number; codigo: string; nombre: string }[];
  semanas: { id: number; numeroSemana: number }[];
  alumnos: PromedioEstudiante[];
}

@Component({
  selector: 'app-reportes-curso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-curso.component.html',
  styleUrls: ['./reportes-curso.component.scss']
})
export class ReportesCursoComponent implements OnInit {
  @Input() cargaId!: number;
  @Input() cursoInfo: any = {}; // Recibe curso, grado, seccion
  
  private calificacionService = inject(CalificacionService);
  private reportePdfService = inject(ReportePdfService);
  private cdr = inject(ChangeDetectorRef);

  periodos: PeriodoAcademico[] = [];
  periodoSeleccionadoId: number = 0;
  
  competencias: { id: number; nombre: string }[] = [];
  semanas: { id: number; numeroSemana: number }[] = [];
  alumnos: PromedioEstudiante[] = [];
  
  isLoading = false;
  reporteGenerado = false;

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    this.isLoading = true;
    this.calificacionService.getConfig().subscribe({
      next: (config: any) => {
        this.periodos = config.periodos;
        if (this.periodos.length > 0) {
          this.periodoSeleccionadoId = this.periodos[0].id;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando periodos', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  generarReporte(): void {
    if (!this.cargaId || !this.periodoSeleccionadoId) return;

    this.isLoading = true;
    
    this.calificacionService.getReporteBimestral(this.cargaId, this.periodoSeleccionadoId).subscribe({
      next: (res: ReporteResponse) => {
        this.competencias = res.competencias;
        this.semanas = res.semanas;
        this.alumnos = res.alumnos.map(a => ({ ...a, isExpanded: false }));
        this.reporteGenerado = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando reporte', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleRow(alumno: PromedioEstudiante): void {
    alumno.isExpanded = !alumno.isExpanded;
    this.cdr.detectChanges();
  }

  getNotaSemana(alumno: PromedioEstudiante, compId: number, semId: number): string {
    const detalles = alumno.detallesSemanales[compId.toString()];
    if (!detalles) return '-';
    const item = detalles.find(d => d.semanaId === semId);
    return item ? item.nota : '-';
  }

  descargarLibretas(): void {
    const periodoNombre = this.periodos.find(p => p.id === this.periodoSeleccionadoId)?.nombre || 'Bimestre';
    
    this.reportePdfService.generarBoleta(
      this.cursoInfo.curso || 'Curso',
      this.cursoInfo.grado || '-',
      this.cursoInfo.seccion || '-',
      periodoNombre,
      this.competencias,
      this.alumnos
    );
  }
}

