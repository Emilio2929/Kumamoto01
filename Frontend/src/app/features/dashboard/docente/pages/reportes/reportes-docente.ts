import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalificacionService, CargaDocente, PeriodoAcademico, SemanaAcademica, Competencia } from '../../../../../core/services/calificacion.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface NotaSemana {
  semanaId: number;
  numeroSemana: number;
  nota: string;
}

interface AlumnoReporte {
  estudianteId: number;
  nombreCompleto: string;
  promediosCompetencias: Record<string, string>;
  promedioBimestre: string;
  detallesSemanales: Record<string, NotaSemana[]>;
}

interface ReporteData {
  competencias: Competencia[];
  semanas: SemanaAcademica[];
  alumnos: AlumnoReporte[];
}

interface CompetenciaMetrica {
  competencia: Competencia;
  conteo: {
    AD: number;
    A: number;
    B: number;
    C: number;
    sinNota: number;
  };
  porcentajes: {
    AD: number;
    A: number;
    B: number;
    C: number;
  };
  totalEvaluados: number;
}

interface CompetenciaMal {
  codigo: string;
  nombre: string;
  notaPromedio: string;
}

interface AlumnoRefuerzoItem {
  estudianteId: number;
  nombreCompleto: string;
  competenciasMal: CompetenciaMal[];
}

@Component({
  selector: 'app-reportes-docente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-docente.html',
  styleUrl: './reportes-docente.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportesDocenteComponent implements OnInit {
  private calificacionService = inject(CalificacionService);
  private cdr = inject(ChangeDetectorRef);

  // Pestaña Activa
  activeTab: 'METRICAS' | 'REFUERZO' = 'METRICAS';

  // Cursos y Configuración
  cursos: CargaDocente[] = [];
  periodos: PeriodoAcademico[] = [];
  
  // Selección General
  selectedCargaId: number | null = null;
  selectedPeriodoId: number | null = null;
  selectedSemanaId: number = 0; // 0 significa Promedio Bimestral
  filtroEscala: 'TODOS' | 'AD' | 'A' | 'B' | 'C' = 'TODOS';

  // Selección y Filtros específicos para Reporte de Refuerzo
  semanasSeleccionadasRefuerzo: Record<number, boolean> = {};
  alumnosRefuerzo: AlumnoRefuerzoItem[] = [];
  criterioRefuerzo: 'SOLO_C' | 'C_Y_B' = 'SOLO_C';

  // Datos cargados del backend
  reporteData: ReporteData | null = null;
  semanasDisponibles: SemanaAcademica[] = [];
  
  // Datos procesados para la vista de Métricas
  metricasCompetencias: CompetenciaMetrica[] = [];
  alumnosFiltrados: any[] = [];
  
  // Métricas generales de la cabecera
  totalAlumnos = 0;
  totalEsperado = 0; // AD + A
  totalProceso = 0;  // B
  totalRefuerzo = 0; // C

  // Estados de carga y error
  loadingCursos = true;
  loadingReporte = false;
  errorMsg: string | null = null;

  ngOnInit(): void {
    this.cargarCursosYConfig();
  }

  setTab(tab: 'METRICAS' | 'REFUERZO'): void {
    this.activeTab = tab;
    if (tab === 'REFUERZO') {
      this.procesarReporteRefuerzo();
    }
    this.cdr.markForCheck();
  }

  cargarCursosYConfig(): void {
    this.loadingCursos = true;
    this.errorMsg = null;
    
    // Cargar cursos
    this.calificacionService.getMisCursos().subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        if (cursos.length > 0) {
          this.selectedCargaId = cursos[0].cargaId;
        }

        // Cargar periodos (Bimestres)
        this.calificacionService.getConfig().subscribe({
          next: (config) => {
            this.periodos = config.periodos;
            if (this.periodos.length > 0) {
              this.selectedPeriodoId = this.periodos[0].id;
              this.actualizarSemanasDisponibles();
            }
            this.loadingCursos = false;
            this.generarReporte();
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.errorMsg = 'Error al cargar la configuración de bimestres.';
            this.loadingCursos = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar los cursos asignados.';
        this.loadingCursos = false;
        this.cdr.markForCheck();
      }
    });
  }

  onPeriodoChange(): void {
    this.actualizarSemanasDisponibles();
    this.selectedSemanaId = 0; // Reset a Promedio Bimestral
    this.generarReporte();
  }

  onCargaChange(): void {
    this.generarReporte();
  }

  onSemanaChange(): void {
    this.procesarMetricasYFiltros();
  }

  onFiltroChange(escala: 'TODOS' | 'AD' | 'A' | 'B' | 'C'): void {
    this.filtroEscala = escala;
    this.procesarMetricasYFiltros();
  }

  actualizarSemanasDisponibles(): void {
    if (!this.selectedPeriodoId) {
      this.semanasDisponibles = [];
      this.semanasSeleccionadasRefuerzo = {};
      return;
    }
    const periodo = this.periodos.find(p => p.id == this.selectedPeriodoId);
    this.semanasDisponibles = periodo?.semanas || [];
    
    // Por defecto marcar todas las semanas para el reporte de refuerzo
    this.semanasSeleccionadasRefuerzo = {};
    this.semanasDisponibles.forEach(s => {
      this.semanasSeleccionadasRefuerzo[s.id] = true;
    });
  }

  toggleTodasSemanas(marcar: boolean): void {
    this.semanasDisponibles.forEach(s => {
      this.semanasSeleccionadasRefuerzo[s.id] = marcar;
    });
    this.procesarReporteRefuerzo();
  }

  onSemanaRefuerzoToggle(semanaId: number): void {
    this.procesarReporteRefuerzo();
  }

  onCriterioRefuerzoChange(criterio: 'SOLO_C' | 'C_Y_B'): void {
    this.criterioRefuerzo = criterio;
    this.procesarReporteRefuerzo();
  }

  generarReporte(): void {
    if (!this.selectedCargaId || !this.selectedPeriodoId) return;

    this.loadingReporte = true;
    this.errorMsg = null;
    this.reporteData = null;
    this.cdr.markForCheck();

    this.calificacionService.getReporteBimestral(this.selectedCargaId, this.selectedPeriodoId).subscribe({
      next: (data: ReporteData) => {
        this.reporteData = data;
        this.procesarMetricasYFiltros();
        this.procesarReporteRefuerzo();
        this.loadingReporte = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMsg = 'Error al generar el reporte de calificaciones.';
        this.loadingReporte = false;
        this.cdr.markForCheck();
      }
    });
  }

  procesarMetricasYFiltros(): void {
    if (!this.reporteData || !this.reporteData.alumnos) return;

    const alumnos = this.reporteData.alumnos;
    const competencias = this.reporteData.competencias;
    const isBimestral = Number(this.selectedSemanaId) === 0;

    // 1. Procesar Métricas por Competencia
    this.metricasCompetencias = competencias.map(comp => {
      const conteo = { AD: 0, A: 0, B: 0, C: 0, sinNota: 0 };
      let totalEvaluados = 0;

      alumnos.forEach(al => {
        let nota = '-';
        if (isBimestral) {
          nota = al.promediosCompetencias[comp.id.toString()] ?? '-';
        } else {
          const listaSemanas = al.detallesSemanales[comp.id.toString()] || [];
          const sem = listaSemanas.find(s => s.semanaId == this.selectedSemanaId);
          nota = sem?.nota ?? '-';
        }

        if (nota === 'AD') { conteo.AD++; totalEvaluados++; }
        else if (nota === 'A') { conteo.A++; totalEvaluados++; }
        else if (nota === 'B') { conteo.B++; totalEvaluados++; }
        else if (nota === 'C') { conteo.C++; totalEvaluados++; }
        else { conteo.sinNota++; }
      });

      return {
        competencia: comp,
        conteo,
        totalEvaluados,
        porcentajes: {
          AD: totalEvaluados > 0 ? Math.round((conteo.AD / totalEvaluados) * 100) : 0,
          A: totalEvaluados > 0 ? Math.round((conteo.A / totalEvaluados) * 100) : 0,
          B: totalEvaluados > 0 ? Math.round((conteo.B / totalEvaluados) * 100) : 0,
          C: totalEvaluados > 0 ? Math.round((conteo.C / totalEvaluados) * 100) : 0,
        }
      };
    });

    // 2. Calcular Métricas Globales de Cabecera
    this.totalAlumnos = alumnos.length;
    this.totalEsperado = 0;
    this.totalProceso = 0;
    this.totalRefuerzo = 0;

    // Procesar lista de alumnos con sus notas para la vista
    const alumnosProcesados = alumnos.map(al => {
      const notasComp: Record<string, string> = {};
      let tieneC = false;
      let tieneB = false;
      let tieneA = false;
      let tieneAD = false;
      let notaGlobal = '-';

      if (isBimestral) {
        notaGlobal = al.promedioBimestre;
      } else {
        let sum = 0;
        let count = 0;
        competencias.forEach(comp => {
          const listaSemanas = al.detallesSemanales[comp.id.toString()] || [];
          const sem = listaSemanas.find(s => s.semanaId == this.selectedSemanaId);
          const n = sem?.nota ?? '-';
          if (n === 'AD') { sum += 4; count++; tieneAD = true; }
          else if (n === 'A') { sum += 3; count++; tieneA = true; }
          else if (n === 'B') { sum += 2; count++; tieneB = true; }
          else if (n === 'C') { sum += 1; count++; tieneC = true; }
        });
        if (count > 0) {
          const avg = sum / count;
          if (avg >= 3.5) notaGlobal = 'AD';
          else if (avg >= 2.5) notaGlobal = 'A';
          else if (avg >= 1.5) notaGlobal = 'B';
          else notaGlobal = 'C';
        }
      }

      competencias.forEach(comp => {
        let n = '-';
        if (isBimestral) {
          n = al.promediosCompetencias[comp.id.toString()] ?? '-';
        } else {
          const listaSemanas = al.detallesSemanales[comp.id.toString()] || [];
          const sem = listaSemanas.find(s => s.semanaId == this.selectedSemanaId);
          n = sem?.nota ?? '-';
        }
        notasComp[comp.id.toString()] = n;

        if (n === 'AD') tieneAD = true;
        if (n === 'A') tieneA = true;
        if (n === 'B') tieneB = true;
        if (n === 'C') tieneC = true;
      });

      if (notaGlobal === 'AD' || notaGlobal === 'A') this.totalEsperado++;
      else if (notaGlobal === 'B') this.totalProceso++;
      else if (notaGlobal === 'C' || tieneC) this.totalRefuerzo++;

      return {
        ...al,
        notasComp,
        notaGlobal,
        tieneC,
        tieneB,
        tieneA,
        tieneAD,
        necesitaRefuerzo: tieneC || notaGlobal === 'C'
      };
    });

    // 3. Filtrar Alumnos según filtroEscala
    if (this.filtroEscala === 'TODOS') {
      this.alumnosFiltrados = alumnosProcesados;
    } else if (this.filtroEscala === 'C') {
      this.alumnosFiltrados = alumnosProcesados.filter(a => a.tieneC || a.notaGlobal === 'C');
    } else if (this.filtroEscala === 'B') {
      this.alumnosFiltrados = alumnosProcesados.filter(a => a.tieneB || a.notaGlobal === 'B');
    } else if (this.filtroEscala === 'A') {
      this.alumnosFiltrados = alumnosProcesados.filter(a => a.tieneA || a.notaGlobal === 'A');
    } else if (this.filtroEscala === 'AD') {
      this.alumnosFiltrados = alumnosProcesados.filter(a => a.tieneAD || a.notaGlobal === 'AD');
    }

    this.cdr.markForCheck();
  }

  procesarReporteRefuerzo(): void {
    if (!this.reporteData || !this.reporteData.alumnos) return;

    const alumnos = this.reporteData.alumnos;
    const competencias = this.reporteData.competencias;
    
    // Obtener IDs de semanas seleccionadas
    const selectedWeekIds = this.semanasDisponibles
      .filter(s => this.semanasSeleccionadasRefuerzo[s.id])
      .map(s => s.id);

    const resultadoRefuerzo: AlumnoRefuerzoItem[] = [];

    alumnos.forEach(al => {
      const competenciasMal: CompetenciaMal[] = [];

      competencias.forEach(comp => {
        const listaSemanas = al.detallesSemanales[comp.id.toString()] || [];
        
        let sum = 0;
        let count = 0;

        selectedWeekIds.forEach(wId => {
          const sem = listaSemanas.find(s => s.semanaId == wId);
          const nota = sem?.nota ?? '-';
          if (nota === 'AD') { sum += 4; count++; }
          else if (nota === 'A') { sum += 3; count++; }
          else if (nota === 'B') { sum += 2; count++; }
          else if (nota === 'C') { sum += 1; count++; }
        });

        if (count > 0) {
          const avg = sum / count;
          let letraAvg = '-';
          if (avg >= 3.5) letraAvg = 'AD';
          else if (avg >= 2.5) letraAvg = 'A';
          else if (avg >= 1.5) letraAvg = 'B';
          else letraAvg = 'C';

          if (this.criterioRefuerzo === 'SOLO_C' && letraAvg === 'C') {
            competenciasMal.push({ codigo: comp.codigo, nombre: comp.nombre, notaPromedio: letraAvg });
          } else if (this.criterioRefuerzo === 'C_Y_B' && (letraAvg === 'C' || letraAvg === 'B')) {
            competenciasMal.push({ codigo: comp.codigo, nombre: comp.nombre, notaPromedio: letraAvg });
          }
        }
      });

      if (competenciasMal.length > 0) {
        resultadoRefuerzo.push({
          estudianteId: al.estudianteId,
          nombreCompleto: al.nombreCompleto,
          competenciasMal
        });
      }
    });

    this.alumnosRefuerzo = resultadoRefuerzo;
    this.cdr.markForCheck();
  }

  getCursoNombre(): string {
    const curso = this.cursos.find(c => c.cargaId == this.selectedCargaId);
    return curso ? `${curso.curso} (${curso.grado} ${curso.seccion})` : 'Curso Seleccionado';
  }

  getPeriodoNombre(): string {
    const per = this.periodos.find(p => p.id == this.selectedPeriodoId);
    return per ? per.nombre : 'Bimestre';
  }

  getSemanaNombre(): string {
    if (Number(this.selectedSemanaId) === 0) return 'Promedio Bimestral';
    const sem = this.semanasDisponibles.find(s => s.id == this.selectedSemanaId);
    return sem ? `Semana ${sem.numeroSemana}` : 'Semana';
  }

  imprimirReporte(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // 1. Encabezado Institucional (Blanco y Negro, Optimizado Lado a Lado)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Negro puro
    doc.text('I.E. KUMAMOTO I', 15, 18);

    doc.setFontSize(12);
    const titulo = this.activeTab === 'METRICAS' 
      ? 'REPORTE OFICIAL DE LOGROS Y METRICAS ACADEMICAS' 
      : 'REPORTE OFICIAL DE ESTUDIANTES PARA REFUERZO ACADEMICO';
    doc.text(titulo, 15, 24);

    // Estructura de Metadatos (Sin superposición)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const docenteNombre = localStorage.getItem('usuario_nombre') || 'Carlos Mendoza';
    const docenteRol = localStorage.getItem('usuario_rol') || 'Docente';

    // Línea 1: Curso (Ocupa todo el ancho disponible)
    doc.text(`Curso: ${this.getCursoNombre()}`, 15, 31);

    // Línea 2: Docente (Ocupa todo el ancho disponible)
    doc.text(`Docente: ${docenteNombre} (${docenteRol})`, 15, 36);

    // Línea 3: Bimestre (Izquierda) y Semanas Evaluadas (Derecha)
    doc.text(`Bimestre: ${this.getPeriodoNombre()}`, 15, 41);

    if (this.activeTab === 'METRICAS') {
      doc.text(`Evaluación: ${this.getSemanaNombre()}`, 110, 41);
    } else {
      const semSeleccionadas = this.semanasDisponibles
        .filter(s => this.semanasSeleccionadasRefuerzo[s.id])
        .map(s => s.numeroSemana)
        .join(', ');
      const semanasTexto = semSeleccionadas ? `Semanas evaluadas: ${semSeleccionadas}` : 'Semanas evaluadas: Todas';
      doc.text(semanasTexto, 110, 41);
    }

    // Línea divisoria negra compacta
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(15, 45, pageWidth - 15, 45);

    let startY = 50;

    // =========================================================================
    // VISTA 1: METRICAS Y LOGROS (Blanco y Negro)
    // =========================================================================
    if (this.activeTab === 'METRICAS') {
      // Cuadro de Resumen Ejecutivo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Estudiantes: ${this.totalAlumnos}   |   Logro Esperado (AD/A): ${this.totalEsperado}   |   En Proceso (B): ${this.totalProceso}   |   Requiere Refuerzo (C): ${this.totalRefuerzo}`, 15, startY);
      startY += 8;

      // Tabla Principal
      const body: any[] = [];
      this.alumnosFiltrados.forEach((a, index) => {
        const malas = this.getCompetenciasMal(a);
        const malasStr = malas.length > 0 
          ? malas.map(m => `[${m.nota}] ${m.codigo}: ${m.nombre}`).join('\n') 
          : 'Nivel Esperado (Sin deficiencias)';

        body.push([
          (index + 1).toString(),
          a.nombreCompleto,
          malasStr,
          a.notaGlobal
        ]);
      });

      autoTable(doc, {
        startY,
        head: [['N°', 'Apellidos y Nombres', 'Competencias con Dificultad (C / B)', 'Global']],
        body,
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.2 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left', cellWidth: 55, fontStyle: 'bold' },
          2: { halign: 'left', cellWidth: 95 },
          3: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }
        },
        styles: { fontSize: 8, cellPadding: 2, valign: 'middle', lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0], fillColor: [255, 255, 255], overflow: 'linebreak' }
      });
    } 
    // =========================================================================
    // VISTA 2: REPORTE DE REFUERZO (Blanco y Negro con RowSpan)
    // =========================================================================
    else {
      const body: any[] = [];
      let index = 1;

      this.alumnosRefuerzo.forEach(a => {
        const compCount = a.competenciasMal.length;

        // Fila principal del alumno (con rowSpan para N° y Nombre en blanco y negro)
        body.push([
          { content: index.toString(), rowSpan: compCount, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0] } },
          { content: a.nombreCompleto, rowSpan: compCount, styles: { valign: 'middle', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0] } },
          { content: `${a.competenciasMal[0].codigo}: ${a.competenciasMal[0].nombre}`, styles: { valign: 'middle', fillColor: [255, 255, 255], textColor: [0, 0, 0] } },
          { content: a.competenciasMal[0].notaPromedio, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0] } }
        ]);

        // Filas subsecuentes para el mismo alumno
        for (let k = 1; k < compCount; k++) {
          body.push([
            { content: `${a.competenciasMal[k].codigo}: ${a.competenciasMal[k].nombre}`, styles: { valign: 'middle', fillColor: [255, 255, 255], textColor: [0, 0, 0] } },
            { content: a.competenciasMal[k].notaPromedio, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0] } }
          ]);
        }

        index++;
      });

      if (this.alumnosRefuerzo.length === 0) {
        body.push([{ content: 'No se encontraron estudiantes que requieran refuerzo bajo el criterio seleccionado.', colSpan: 4, styles: { halign: 'center', fontStyle: 'italic', textColor: [0, 0, 0], fillColor: [255, 255, 255] } }]);
      }

      autoTable(doc, {
        startY,
        head: [['N°', 'Apellidos y Nombres', 'Competencia Deficiente', 'Promedio']],
        body,
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.2 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left', cellWidth: 60, fontStyle: 'bold' },
          2: { halign: 'left', cellWidth: 90 },
          3: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }
        },
        styles: { fontSize: 8, cellPadding: 2, valign: 'middle', lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0], fillColor: [255, 255, 255], overflow: 'linebreak' }
      });
    }

    // =========================================================================
    // PIE DE PÁGINA Y FIRMA
    // =========================================================================
    const finalY = (doc as any).lastAutoTable.finalY || startY + 20;
    let sigY = finalY + 30;

    if (sigY > pageHeight - 35) {
      doc.addPage();
      sigY = 40;
    }

    // Línea de firma
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(130, sigY, 180, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Firma del Docente', 155, sigY + 5, { align: 'center' });

    // Numeración de páginas
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Página ${i} de ${pageCount} | Sistema de Gestión Académica Kumamoto I`, 105, pageHeight - 10, { align: 'center' });
    }

    // Descargar archivo PDF directamente
    const nombreArchivo = this.activeTab === 'METRICAS' 
      ? `Reporte_Metricas_${this.getCursoNombre().replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      : `Reporte_Refuerzo_${this.getCursoNombre().replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    doc.save(nombreArchivo);
  }

  getBadgeClass(nota: string): string {
    switch (nota) {
      case 'AD': return 'badge-ad';
      case 'A': return 'badge-a';
      case 'B': return 'badge-b';
      case 'C': return 'badge-c';
      default: return 'badge-none';
    }
  }

  getCompetenciasMal(alumno: any): { codigo: string, nombre: string, nota: string }[] {
    if (!this.reporteData || !this.reporteData.competencias) return [];
    const malas: { codigo: string, nombre: string, nota: string }[] = [];
    
    this.reporteData.competencias.forEach(c => {
      const nota = alumno.notasComp[c.id.toString()];
      if (nota === 'C' || nota === 'B') {
        malas.push({ codigo: c.codigo, nombre: c.nombre, nota });
      }
    });

    return malas;
  }
}
