import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EstructuraService,
  CursoDetalleDto,
  AulaDetalleDto,
} from '../../../../../../../core/services/estructura';

@Component({
  selector: 'app-cursos-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './cursos-manager.html',
  styleUrl: './cursos-manager.scss',
})
export class CursosManager implements OnInit {
  private svc = inject(EstructuraService);
  private cdr = inject(ChangeDetectorRef);

  // ── Cursos ──────────────────────────────────────────────────────────
  cursos: CursoDetalleDto[] = [];
  cursosFiltrados: CursoDetalleDto[] = [];
  loading = true;
  errorLoad: string | null = null;
  busqueda = '';

  // ── Aulas disponibles para asignar
  aulasDisponibles: AulaDetalleDto[] = [];

  // ── Modal Curso (crear/editar)
  modalCurso = false;
  modoEdicion = false;
  cursoEditandoId: number | null = null;
  nombreCurso = '';
  errorModal: string | null = null;
  guardando = false;

  // ── Modal asignar aula
  modalAsignar = false;
  cursoAsignandoId: number | null = null;
  cursoAsignandoNombre = '';
  aulaSeleccionadaId: number | null = null;
  errorAsignar: string | null = null;
  asignando = false;

  // ── Confirmar eliminar
  confirmEliminarId: number | null = null;

  ngOnInit(): void {
    this.cargarCursos();
    this.cargarAulas();
  }

  cargarCursos(): void {
    this.loading = true;
    this.errorLoad = null;
    this.svc.getCursos().subscribe({
      next: (data) => {
        this.cursos = data;
        this.filtrar();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorLoad = `Error ${err?.status}: No se pudieron cargar los cursos.`;
        this.cdr.markForCheck();
      },
    });
  }

  cargarAulas(): void {
    this.svc.getAulasDetalle().subscribe({
      next: (data) => {
        this.aulasDisponibles = data.filter(a => a.estado === 1);
        this.cdr.markForCheck();
      },
    });
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.cursosFiltrados = q
      ? this.cursos.filter(c => c.nombre.toLowerCase().includes(q))
      : [...this.cursos];
  }

  onBusqueda(): void { this.filtrar(); }

  // ── Modal Curso ──────────────────────────────────────────────────────
  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.cursoEditandoId = null;
    this.nombreCurso = '';
    this.errorModal = null;
    this.modalCurso = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(c: CursoDetalleDto): void {
    this.modoEdicion = true;
    this.cursoEditandoId = c.id;
    this.nombreCurso = c.nombre;
    this.errorModal = null;
    this.modalCurso = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void { this.modalCurso = false; this.cdr.markForCheck(); }

  guardar(): void {
    if (!this.nombreCurso.trim()) { this.errorModal = 'El nombre es requerido.'; return; }
    this.guardando = true;
    this.errorModal = null;

    const onOk = () => {
      this.guardando = false;
      this.cerrarModal();
      this.cargarCursos();
    };
    const onErr = (err: any) => {
      this.guardando = false;
      this.errorModal = err?.error?.mensaje ?? 'Error al guardar.';
      this.cdr.markForCheck();
    };

    if (this.modoEdicion) {
      this.svc.updateCurso(this.cursoEditandoId!, this.nombreCurso.trim()).subscribe({ next: onOk, error: onErr });
    } else {
      this.svc.createCurso(this.nombreCurso.trim()).subscribe({ next: onOk, error: onErr });
    }
  }

  toggleEstado(c: CursoDetalleDto): void {
    this.svc.toggleCursoEstado(c.id).subscribe({
      next: (res) => { c.estado = res.estado; this.cdr.markForCheck(); },
    });
  }

  pedirEliminar(id: number): void { this.confirmEliminarId = id; this.cdr.markForCheck(); }
  cancelarEliminar(): void { this.confirmEliminarId = null; this.cdr.markForCheck(); }
  confirmarEliminar(): void {
    if (this.confirmEliminarId === null) return;
    this.svc.deleteCurso(this.confirmEliminarId).subscribe({
      next: () => { this.confirmEliminarId = null; this.cargarCursos(); },
    });
  }

  // ── Modal asignar aula ───────────────────────────────────────────────
  abrirModalAsignar(c: CursoDetalleDto): void {
    this.cursoAsignandoId = c.id;
    this.cursoAsignandoNombre = c.nombre;
    this.aulaSeleccionadaId = null;
    this.errorAsignar = null;
    this.modalAsignar = true;
    this.cdr.markForCheck();
  }

  cerrarModalAsignar(): void { this.modalAsignar = false; this.cdr.markForCheck(); }

  /** Aulas que aún no están asignadas a este curso */
  get aulasNoAsignadas(): AulaDetalleDto[] {
    const curso = this.cursos.find(c => c.id === this.cursoAsignandoId);
    if (!curso) return this.aulasDisponibles;
    const asignadasIds = new Set(curso.aulas.map(a => a.aulaId));
    return this.aulasDisponibles.filter(a => !asignadasIds.has(a.id));
  }

  asignarAula(): void {
    if (!this.aulaSeleccionadaId || !this.cursoAsignandoId) return;
    this.asignando = true;
    this.errorAsignar = null;

    this.svc.asignarAulaACurso(this.cursoAsignandoId, this.aulaSeleccionadaId).subscribe({
      next: () => {
        this.asignando = false;
        this.cerrarModalAsignar();
        this.cargarCursos();
      },
      error: (err) => {
        this.asignando = false;
        this.errorAsignar = err?.error?.mensaje ?? 'Error al asignar.';
        this.cdr.markForCheck();
      },
    });
  }

  removerAsignacion(cargaId: number): void {
    this.svc.removerAsignacionCurso(cargaId).subscribe({
      next: () => this.cargarCursos(),
    });
  }

  aulaLabel(a: AulaDetalleDto): string {
    return `${a.gradoNombre} - Sección ${a.seccionLetra}`;
  }
}
