import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuxiliarService, AulaAsignadaAuxiliarDto } from '../../../../core/services/auxiliar';
import { IncidenciasService } from '../../../../core/services/incidencias';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-incidencias-auxiliar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidencias-auxiliar.html',
  styleUrl: './incidencias-auxiliar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncidenciasAuxiliarComponent implements OnInit {
  private auxiliarService = inject(AuxiliarService);
  private incidenciasService = inject(IncidenciasService);
  private cdr = inject(ChangeDetectorRef);

  vista: 'registrar' | 'historial' = 'registrar';

  aulas: AulaAsignadaAuxiliarDto[] = [];
  cursos: any[] = [];
  estudiantes: any[] = [];
  incidencias: any[] = [];

  // Filtros Registro
  selectedAulaId: number | null = null;
  selectedCursoId: number | null = null;
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  // Filtros Historial
  historialAulaId: number | null = null;
  historialSearchQuery: string = '';
  private historialSearchSubject = new Subject<string>();

  loadingAulas = true;
  loadingCursos = false;
  loadingEstudiantes = false;
  loadingIncidencias = false;

  // Modal Incidencia
  activeModal = false;
  selectedEstudiante: any = null;
  tipoIncidencia: string = 'Conducta';
  descripcion: string = '';
  savingIncidencia = false;

  // Modal Alerta/Éxito
  modalAlert = {
    show: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error'
  };

  ngOnInit() {
    this.cargarAulas();

    // Búsqueda en tiempo real Registro
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery = query;
      this.cargarEstudiantes();
    });

    // Búsqueda en tiempo real Historial
    this.historialSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.historialSearchQuery = query;
      this.cargarIncidencias();
    });
  }

  setVista(v: 'registrar' | 'historial') {
    this.vista = v;
    if (v === 'historial' && this.incidencias.length === 0) {
      this.cargarIncidencias();
    }
    this.cdr.markForCheck();
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  onHistorialSearchChange(query: string) {
    this.historialSearchSubject.next(query);
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
    this.selectedCursoId = null;
    this.cursos = [];

    if (this.selectedAulaId) {
      this.loadingCursos = true;
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

    this.cargarEstudiantes();
  }

  onCursoChange() {
    this.cargarEstudiantes();
  }

  onHistorialAulaChange() {
    this.cargarIncidencias();
  }

  cargarEstudiantes() {
    // Si no hay aula seleccionada ni búsqueda, no mostrar estudiantes
    if (!this.selectedAulaId && !this.searchQuery.trim()) {
      this.estudiantes = [];
      this.loadingEstudiantes = false;
      this.cdr.markForCheck();
      return;
    }

    this.loadingEstudiantes = true;
    this.cdr.markForCheck();

    this.auxiliarService.buscarEstudiantes(this.selectedAulaId, this.selectedCursoId, this.searchQuery).subscribe({
      next: (data) => {
        this.estudiantes = data;
        this.loadingEstudiantes = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingEstudiantes = false;
        this.cdr.markForCheck();
      }
    });
  }

  cargarIncidencias() {
    this.loadingIncidencias = true;
    this.cdr.markForCheck();

    this.auxiliarService.getIncidencias(this.historialAulaId, this.historialSearchQuery).subscribe({
      next: (data) => {
        this.incidencias = data;
        this.loadingIncidencias = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingIncidencias = false;
        this.cdr.markForCheck();
      }
    });
  }

  limpiarFiltrosRegistro() {
    this.selectedAulaId = null;
    this.selectedCursoId = null;
    this.cursos = [];
    this.searchQuery = '';
    this.estudiantes = [];
    this.cdr.markForCheck();
  }

  limpiarFiltrosHistorial() {
    this.historialAulaId = null;
    this.historialSearchQuery = '';
    this.cargarIncidencias();
  }

  abrirModal(estudiante: any) {
    this.selectedEstudiante = estudiante;
    this.tipoIncidencia = 'Conducta';
    this.descripcion = '';
    this.activeModal = true;
    this.cdr.markForCheck();
  }

  cerrarModal() {
    this.activeModal = false;
    this.selectedEstudiante = null;
    this.cdr.markForCheck();
  }

  guardarIncidencia() {
    if (!this.selectedEstudiante || !this.tipoIncidencia) return;

    this.savingIncidencia = true;
    this.cdr.markForCheck();

    this.incidenciasService.crearIncidencia({
      estudianteId: this.selectedEstudiante.id,
      tipoIncidencia: this.tipoIncidencia,
      descripcion: this.descripcion
    }).subscribe({
      next: () => {
        this.savingIncidencia = false;
        this.activeModal = false;
        this.showAlert('Incidencia Registrada', 'La incidencia se ha registrado exitosamente en el sistema.', 'success');
        if (this.vista === 'historial') {
          this.cargarIncidencias();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.savingIncidencia = false;
        this.showAlert('Error', err.error?.mensaje || 'No se pudo registrar la incidencia.', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  generarPdf() {
    if (!this.incidencias || this.incidencias.length === 0) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO OFICIAL DE INCIDENCIAS', pageWidth / 2, 14, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Metadatos estructurados en blanco y negro
    const aulaIdNum = this.historialAulaId ? Number(this.historialAulaId) : null;
    const aulaSeleccionada = aulaIdNum 
      ? this.aulas.find(a => Number(a.aulaId) === aulaIdNum) 
      : null;
    const aulaTexto = aulaSeleccionada ? `${aulaSeleccionada.gradoNombre} ${aulaSeleccionada.seccionLetra}` : 'Todas las Aulas Asignadas';
    const fechaReporte = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    doc.text(`AULA: ${aulaTexto}`, 14, 22);
    doc.text(`FECHA DE EMISIÓN: ${fechaReporte}`, 14, 27);
    doc.text(`TOTAL INCIDENCIAS: ${this.incidencias.length}`, 130, 22);

    // Línea divisoria negra
    doc.setLineWidth(0.5);
    doc.line(14, 31, pageWidth - 14, 31);

    let tableHead: string[][];
    let tableBody: any[][];
    let colStyles: any;

    if (aulaSeleccionada) {
      // Si es una sola aula, NO se incluye la columna Aula en la tabla
      tableHead = [['N°', 'Fecha y Hora', 'Estudiante', 'Tipo', 'Descripción']];
      tableBody = this.incidencias.map((inc: any, index: number) => [
        (index + 1).toString(),
        new Date(inc.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        inc.estudianteNombre,
        inc.tipoIncidencia,
        inc.descripcion || 'Sin descripción'
      ]);
      colStyles = {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 60 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 57 }
      };
    } else {
      // Si son todas las aulas, SÍ se incluye la columna Aula en la tabla
      tableHead = [['N°', 'Fecha y Hora', 'Estudiante', 'Aula', 'Tipo', 'Descripción']];
      tableBody = this.incidencias.map((inc: any, index: number) => [
        (index + 1).toString(),
        new Date(inc.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        inc.estudianteNombre,
        inc.aulaNombre,
        inc.tipoIncidencia,
        inc.descripcion || 'Sin descripción'
      ]);
      colStyles = {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 28, halign: 'center' },
        2: { cellWidth: 50 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 49 }
      };
    }

    autoTable(doc, {
      startY: 35,
      head: tableHead,
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.2 },
      styles: { fontSize: 8.5, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0] },
      columnStyles: colStyles
    });

    doc.save(`Registro_Incidencias_${aulaTexto.replace(/\s+/g, '_')}.pdf`);
  }

  showAlert(title: string, message: string, type: 'success' | 'error') {
    this.modalAlert = { show: true, title, message, type };
    this.cdr.markForCheck();
  }

  closeAlert() {
    this.modalAlert.show = false;
    this.cdr.markForCheck();
  }

  getIncidenciaBadgeClass(tipo: string) {
    switch (tipo) {
      case 'Conducta': return 'badge-conducta';
      case 'Tardanza': return 'badge-tardanza';
      case 'Uniforme': return 'badge-uniforme';
      case 'Academico': return 'badge-academico';
      default: return 'badge-otro';
    }
  }
}
