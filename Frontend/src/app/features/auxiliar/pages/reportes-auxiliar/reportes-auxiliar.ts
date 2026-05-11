import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuxiliarService, AulaAsignadaAuxiliarDto } from '../../../../core/services/auxiliar';

@Component({
  selector: 'app-reportes-auxiliar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-auxiliar.html',
  styleUrl: './reportes-auxiliar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportesAuxiliarComponent implements OnInit {
  private auxiliarService = inject(AuxiliarService);
  private cdr = inject(ChangeDetectorRef);

  aulas: AulaAsignadaAuxiliarDto[] = [];
  cursos: any[] = [];
  
  selectedAulaId: number | null = null;
  selectedCursoId: number | null = null;
  fechaInicio: string = '';
  fechaFin: string = '';
  vista: 'resumen' | 'detallado' = 'resumen';

  reportData: any = null;
  detailedLogs: any[] = [];
  
  loadingAulas = true;
  loadingCursos = false;
  loadingReport = false;
  
  cursoNombreReporte: string = '';

  ngOnInit() {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    
    this.fechaFin = today.toISOString().split('T')[0];
    this.fechaInicio = lastMonth.toISOString().split('T')[0];

    this.cargarAulas();
  }

  cargarAulas() {
    this.auxiliarService.getMisAulas().subscribe({
      next: (data) => {
        this.aulas = data;
        this.loadingAulas = false;
        this.cdr.markForCheck();
      }
    });
  }

  onAulaChange() {
    if (!this.selectedAulaId) {
      this.cursos = [];
      this.selectedCursoId = null;
      return;
    }

    this.loadingCursos = true;
    this.cursos = [];
    this.selectedCursoId = null;
    this.cdr.markForCheck();

    this.auxiliarService.getCursosByAula(this.selectedAulaId).subscribe({
      next: (data) => {
        this.cursos = data;
        this.loadingCursos = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingCursos = false;
        this.cdr.markForCheck();
      }
    });
  }

  generarReporte() {
    if (!this.selectedAulaId || !this.selectedCursoId) return;

    this.loadingReport = true;
    this.reportData = null;
    this.detailedLogs = [];
    this.cdr.markForCheck();

    this.auxiliarService.getReporteAsistencia(this.selectedAulaId, this.fechaInicio, this.fechaFin, this.selectedCursoId).subscribe({
      next: (data) => {
        this.cursoNombreReporte = data.cursoNombre;
        this.reportData = this.procesarResumen(data);
        this.detailedLogs = this.procesarDetallado(data);
        this.loadingReport = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingReport = false;
        this.cdr.markForCheck();
      }
    });
  }

  procesarResumen(data: any) {
    const students = data.estudiantes;
    const records = data.asistencias;
    
    return students.map((s: any) => {
      const studentAsists = records.filter((r: any) => r.estudianteId === s.id);
      return {
        ...s,
        total: studentAsists.length,
        presentes: studentAsists.filter((r: any) => r.valor === 'P').length,
        faltas: studentAsists.filter((r: any) => r.valor === 'F').length,
        tardes: studentAsists.filter((r: any) => r.valor === 'T').length,
        porcentaje: studentAsists.length > 0 
          ? Math.round((studentAsists.filter((r: any) => r.valor === 'P').length / studentAsists.length) * 100)
          : 0
      };
    });
  }

  procesarDetallado(data: any) {
    return data.asistencias.map((r: any) => {
      const student = data.estudiantes.find((s: any) => s.id === r.estudianteId);
      return {
        ...r,
        nombreEstudiante: student ? student.nombre : 'Desconocido',
        curso: data.cursoNombre
      };
    }).sort((a: any, b: any) => {
      const dateCompare = (b.fecha || '').localeCompare(a.fecha || '');
      if (dateCompare !== 0) return dateCompare;
      return (a.nombreEstudiante || '').localeCompare(b.nombreEstudiante || '');
    });
  }

  setVista(v: 'resumen' | 'detallado') {
    this.vista = v;
    this.cdr.markForCheck();
  }

  imprimir() {
    window.print();
  }

  getStatusClass(valor: string) {
    switch(valor) {
      case 'P': return 'text-green';
      case 'F': return 'text-red';
      case 'T': return 'text-orange';
      default: return '';
    }
  }

  getStatusLabel(valor: string) {
    switch(valor) {
      case 'P': return 'Presente';
      case 'F': return 'Falta';
      case 'T': return 'Tarde';
      default: return valor;
    }
  }

  getAulaSelectedName() {
    const aula = this.aulas.find(a => a.aulaId == this.selectedAulaId);
    return aula ? `${aula.gradoNombre} ${aula.seccionLetra}` : '...';
  }
}
