import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AuxiliarService, AulaAsignadaAuxiliarDto } from '../../../../core/services/auxiliar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  private http = inject(HttpClient);

  aulas: AulaAsignadaAuxiliarDto[] = [];
  cursos: any[] = [];
  bimestres: any[] = [];
  
  selectedAulaId: number | null = null;
  selectedCursoId: number | null = null;
  
  // Nuevos filtros
  selectedBimestre: any = null;
  selectedSemana: number | null = null;
  selectedDia: number | null = null;
  
  semanasOptions: number[] = [];
  diasOptions: { value: number, label: string }[] = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' }
  ];

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
    this.cargarBimestres();
  }

  cargarBimestres() {
    this.http.get<any>(`${environment.apiUrl}/api/configuracion-anio`).subscribe({
      next: (res) => {
        this.bimestres = res.bimestres || [];
        this.cdr.markForCheck();
      }
    });
  }

  onBimestreChange() {
    this.selectedSemana = null;
    this.selectedDia = null;
    this.semanasOptions = [];

    if (!this.selectedBimestre) {
      return;
    }

    // Llenar semanas (1 hasta semanasCount)
    const count = this.selectedBimestre.semanasCount || 9;
    for (let i = 1; i <= count; i++) {
      this.semanasOptions.push(i);
    }

    // Setear fechas del bimestre
    this.fechaInicio = this.selectedBimestre.fechaInicio;
    this.fechaFin = this.selectedBimestre.fechaFin;
  }

  onSemanaChange() {
    this.selectedDia = null;
    if (!this.selectedSemana || !this.selectedBimestre) {
      this.onBimestreChange(); // revert to bimestre dates
      return;
    }

    // Calcular fecha inicio y fin de la semana
    const bimestreInicio = new Date(this.selectedBimestre.fechaInicio + 'T00:00:00');
    // Sumar semanas (1 semana = 7 días)
    const daysToAdd = (this.selectedSemana - 1) * 7;
    
    const weekStart = new Date(bimestreInicio);
    weekStart.setDate(weekStart.getDate() + daysToAdd);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4); // Viernes

    this.fechaInicio = weekStart.toISOString().split('T')[0];
    this.fechaFin = weekEnd.toISOString().split('T')[0];
  }

  onDiaChange() {
    if (!this.selectedDia || !this.selectedSemana || !this.selectedBimestre) {
      this.onSemanaChange(); // revert to semana dates
      return;
    }

    const bimestreInicio = new Date(this.selectedBimestre.fechaInicio + 'T00:00:00');
    const daysToAdd = (this.selectedSemana - 1) * 7 + (this.selectedDia - 1);
    
    const targetDate = new Date(bimestreInicio);
    targetDate.setDate(targetDate.getDate() + daysToAdd);

    const dateStr = targetDate.toISOString().split('T')[0];
    this.fechaInicio = dateStr;
    this.fechaFin = dateStr;
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
    if (!this.reportData || this.reportData.length === 0) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE OFICIAL DE ASISTENCIA', pageWidth / 2, 14, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Metadatos estructurados en blanco y negro
    doc.text(`AULA: ${this.getAulaSelectedName()}`, 14, 22);
    doc.text(`CURSO: ${this.cursoNombreReporte}`, 14, 27);
    doc.text(`PERIODO: ${this.fechaInicio} al ${this.fechaFin}`, 14, 32);
    
    const totalEstudiantes = this.reportData.length;
    const totalFaltas = this.reportData.reduce((acc: number, curr: any) => acc + curr.faltas, 0);
    const totalTardanzas = this.reportData.reduce((acc: number, curr: any) => acc + curr.tardes, 0);

    doc.text(`ESTUDIANTES: ${totalEstudiantes}`, 130, 22);
    doc.text(`FALTAS TOTALES: ${totalFaltas}`, 130, 27);
    doc.text(`TARDANZAS TOTALES: ${totalTardanzas}`, 130, 32);

    // Línea divisoria negra
    doc.setLineWidth(0.5);
    doc.line(14, 35, pageWidth - 14, 35);

    // Tabla en Blanco y Negro (A4 optimizado para 30+ estudiantes)
    const tableBody = this.reportData.map((s: any, index: number) => [
      (index + 1).toString(),
      s.nombre,
      s.total,
      s.presentes,
      s.faltas,
      s.tardes,
      `${s.porcentaje}%`
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['N°', 'Apellidos y Nombres del Estudiante', 'Sesiones', 'P', 'F', 'T', '% Asist.']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.2 },
      styles: { fontSize: 8.5, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 90 },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' }
      }
    });

    doc.save(`Reporte_Asistencia_${this.cursoNombreReporte}.pdf`);
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

  getGlobalStats() {
    if (!this.reportData || this.reportData.length === 0) {
      return { totalP: 0, totalF: 0, totalT: 0, pctP: 0, pctF: 0, pctT: 0 };
    }
    const totalP = this.reportData.reduce((acc: number, curr: any) => acc + curr.presentes, 0);
    const totalF = this.reportData.reduce((acc: number, curr: any) => acc + curr.faltas, 0);
    const totalT = this.reportData.reduce((acc: number, curr: any) => acc + curr.tardes, 0);
    const totalGeneral = totalP + totalF + totalT;

    if (totalGeneral === 0) return { totalP: 0, totalF: 0, totalT: 0, pctP: 0, pctF: 0, pctT: 0 };

    return {
      totalP, totalF, totalT,
      pctP: Math.round((totalP / totalGeneral) * 100),
      pctF: Math.round((totalF / totalGeneral) * 100),
      pctT: Math.round((totalT / totalGeneral) * 100)
    };
  }
}
