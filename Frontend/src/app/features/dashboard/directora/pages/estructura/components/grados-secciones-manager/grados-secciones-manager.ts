import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EstructuraService,
  GradoDetalleDto,
  SeccionDetalleDto,
} from '../../../../../../../core/services/estructura';

@Component({
  selector: 'app-grados-secciones-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './grados-secciones-manager.html',
  styleUrl: './grados-secciones-manager.scss',
})
export class GradosSeccionesManager implements OnInit {
  private svc = inject(EstructuraService);
  private cdr = inject(ChangeDetectorRef);

  // ── Grados ──────────────────────────────────────────────────────────
  grados: GradoDetalleDto[] = [];
  loadingGrados = true;
  errorLoadGrados: string | null = null;

  modalGrado = false;
  modoEdicionGrado = false;
  gradoEditandoId: number | null = null;
  nombreGrado = '';
  errorGrado: string | null = null;
  guardandoGrado = false;
  confirmEliminarGradoId: number | null = null;

  // ── Secciones ────────────────────────────────────────────────────────
  secciones: SeccionDetalleDto[] = [];
  loadingSecciones = true;
  errorLoadSecciones: string | null = null;

  modalSeccion = false;
  modoEdicionSeccion = false;
  seccionEditandoId: number | null = null;
  letraSeccion = '';
  errorSeccion: string | null = null;
  guardandoSeccion = false;
  confirmEliminarSeccionId: number | null = null;

  ngOnInit(): void {
    this.cargarGrados();
    this.cargarSecciones();
  }

  // ══════════════════════════════════════════════════════
  //  GRADOS
  // ══════════════════════════════════════════════════════

  cargarGrados(): void {
    this.loadingGrados = true;
    this.errorLoadGrados = null;
    this.svc.getGrados().subscribe({
      next: (data) => {
        this.grados = data;
        this.loadingGrados = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingGrados = false;
        this.errorLoadGrados = `Error ${err?.status ?? ''}: No se pudieron cargar los grados.`;
        this.cdr.markForCheck();
      },
    });
  }

  abrirModalGrado(grado?: GradoDetalleDto): void {
    this.errorGrado = null;
    if (grado) {
      this.modoEdicionGrado = true;
      this.gradoEditandoId = grado.id;
      this.nombreGrado = grado.nombre;
    } else {
      this.modoEdicionGrado = false;
      this.gradoEditandoId = null;
      this.nombreGrado = '';
    }
    this.modalGrado = true;
    this.cdr.markForCheck();
  }

  cerrarModalGrado(): void {
    this.modalGrado = false;
    this.cdr.markForCheck();
  }

  guardarGrado(): void {
    if (!this.nombreGrado.trim()) { this.errorGrado = 'El nombre es requerido.'; return; }
    this.guardandoGrado = true;
    this.errorGrado = null;

    const onOk = () => {
      this.guardandoGrado = false;
      this.cerrarModalGrado();
      this.cargarGrados();
    };
    const onErr = (err: any) => {
      this.guardandoGrado = false;
      this.errorGrado = err?.error?.mensaje ?? 'Error al guardar.';
      this.cdr.markForCheck();
    };

    if (this.modoEdicionGrado) {
      this.svc.updateGrado(this.gradoEditandoId!, this.nombreGrado.trim()).subscribe({ next: onOk, error: onErr });
    } else {
      this.svc.createGrado(this.nombreGrado.trim()).subscribe({ next: onOk, error: onErr });
    }
  }

  toggleGrado(g: GradoDetalleDto): void {
    this.svc.toggleGradoEstado(g.id).subscribe({
      next: (res) => {
        g.estado = res.estado;
        this.cdr.markForCheck();
      },
    });
  }

  pedirEliminarGrado(id: number): void { this.confirmEliminarGradoId = id; this.cdr.markForCheck(); }
  cancelarEliminarGrado(): void { this.confirmEliminarGradoId = null; this.cdr.markForCheck(); }
  confirmarEliminarGrado(): void {
    if (this.confirmEliminarGradoId === null) return;
    this.svc.deleteGrado(this.confirmEliminarGradoId).subscribe({
      next: () => {
        this.confirmEliminarGradoId = null;
        this.cargarGrados();
      },
    });
  }

  // ══════════════════════════════════════════════════════
  //  SECCIONES
  // ══════════════════════════════════════════════════════

  cargarSecciones(): void {
    this.loadingSecciones = true;
    this.errorLoadSecciones = null;
    this.svc.getSecciones().subscribe({
      next: (data) => {
        this.secciones = data;
        this.loadingSecciones = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingSecciones = false;
        this.errorLoadSecciones = `Error ${err?.status ?? ''}: No se pudieron cargar las secciones.`;
        this.cdr.markForCheck();
      },
    });
  }

  abrirModalSeccion(sec?: SeccionDetalleDto): void {
    this.errorSeccion = null;
    if (sec) {
      this.modoEdicionSeccion = true;
      this.seccionEditandoId = sec.id;
      this.letraSeccion = sec.letra;
    } else {
      this.modoEdicionSeccion = false;
      this.seccionEditandoId = null;
      this.letraSeccion = '';
    }
    this.modalSeccion = true;
    this.cdr.markForCheck();
  }

  cerrarModalSeccion(): void {
    this.modalSeccion = false;
    this.cdr.markForCheck();
  }

  guardarSeccion(): void {
    if (!this.letraSeccion.trim()) { this.errorSeccion = 'La letra es requerida.'; return; }
    this.guardandoSeccion = true;
    this.errorSeccion = null;

    const onOk = () => {
      this.guardandoSeccion = false;
      this.cerrarModalSeccion();
      this.cargarSecciones();
    };
    const onErr = (err: any) => {
      this.guardandoSeccion = false;
      this.errorSeccion = err?.error?.mensaje ?? 'Error al guardar.';
      this.cdr.markForCheck();
    };

    if (this.modoEdicionSeccion) {
      this.svc.updateSeccion(this.seccionEditandoId!, this.letraSeccion.trim()).subscribe({ next: onOk, error: onErr });
    } else {
      this.svc.createSeccion(this.letraSeccion.trim()).subscribe({ next: onOk, error: onErr });
    }
  }

  toggleSeccion(s: SeccionDetalleDto): void {
    this.svc.toggleSeccionEstado(s.id).subscribe({
      next: (res) => {
        s.estado = res.estado;
        this.cdr.markForCheck();
      },
    });
  }

  pedirEliminarSeccion(id: number): void { this.confirmEliminarSeccionId = id; this.cdr.markForCheck(); }
  cancelarEliminarSeccion(): void { this.confirmEliminarSeccionId = null; this.cdr.markForCheck(); }
  confirmarEliminarSeccion(): void {
    if (this.confirmEliminarSeccionId === null) return;
    this.svc.deleteSeccion(this.confirmEliminarSeccionId).subscribe({
      next: () => {
        this.confirmEliminarSeccionId = null;
        this.cargarSecciones();
      },
    });
  }
}
