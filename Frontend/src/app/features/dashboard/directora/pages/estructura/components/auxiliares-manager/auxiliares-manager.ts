import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsignacionAuxiliarService, AuxiliarAsignacionesGroupDto, BulkAsignarAuxiliarDto } from '../../../../../../../core/services/asignacion-auxiliar';
import { AuxiliaresAdminService, AuxiliarDetalleDto } from '../../../../../../../core/services/auxiliares-admin';
import { EstructuraService, AulaDto } from '../../../../../../../core/services/estructura';

@Component({
  selector: 'app-auxiliares-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './auxiliares-manager.html',
  styleUrl: './auxiliares-manager.scss',
})
export class AuxiliaresManager implements OnInit {
  private asigSvc = inject(AsignacionAuxiliarService);
  private auxSvc = inject(AuxiliaresAdminService);
  private estSvc = inject(EstructuraService);
  private cdr = inject(ChangeDetectorRef);

  // ── Listas ─────────────────────────────────────────────────
  asignaciones: AuxiliarAsignacionesGroupDto[] = [];
  asignacionesFiltradas: AuxiliarAsignacionesGroupDto[] = [];
  loading = true;
  errorLoad: string | null = null;
  busqueda = '';

  // ── Combos ────────────────────────────────────────────────
  auxiliares: AuxiliarDetalleDto[] = [];
  aulas: AulaDto[] = [];

  // ── Modal ─────────────────────────────────────────────────
  modal = false;
  formAuxiliarId: number | null = null;
  formAulaIds: number[] = [];
  formPeriodo = new Date().getFullYear().toString();

  errorModal: string | null = null;
  guardando = false;

  // ── Confirmar eliminar ─────────────────────────────────────
  confirmEliminarId: number | null = null;

  ngOnInit(): void {
    this.cargar();
    this.cargarCombos();
  }

  cargar(): void {
    this.loading = true;
    this.errorLoad = null;
    this.asigSvc.getGrouped().subscribe({
      next: (data) => {
        this.asignaciones = data;
        this.filtrar();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorLoad = 'Error al cargar las asignaciones.';
        this.cdr.markForCheck();
      },
    });
  }

  cargarCombos(): void {
    this.auxSvc.getAll().subscribe({
      next: (data) => { this.auxiliares = data.filter(a => a.estado === 1); this.cdr.markForCheck(); }
    });
    this.estSvc.getAulasCombo().subscribe({
      next: (data) => { this.aulas = data; this.cdr.markForCheck(); }
    });
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.asignacionesFiltradas = q
      ? this.asignaciones.filter(a =>
          a.auxiliarNombre.toLowerCase().includes(q) ||
          a.aulas.some(au => au.gradoNombre.toLowerCase().includes(q) || au.seccionLetra.toLowerCase().includes(q))
        )
      : [...this.asignaciones];
  }

  onBusqueda(): void { this.filtrar(); }

  abrirModal(): void {
    this.formAuxiliarId = null;
    this.formAulaIds = [];
    this.formPeriodo = new Date().getFullYear().toString();
    this.errorModal = null;
    this.modal = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void { this.modal = false; this.cdr.markForCheck(); }

  toggleAula(id: number): void {
    const idx = this.formAulaIds.indexOf(id);
    if (idx === -1) this.formAulaIds.push(id);
    else this.formAulaIds.splice(idx, 1);
  }

  isAulaSelected(id: number): boolean {
    return this.formAulaIds.includes(id);
  }

  guardar(): void {
    if (!this.formAuxiliarId || this.formAulaIds.length === 0 || !this.formPeriodo) {
      this.errorModal = 'Seleccione un auxiliar, al menos un aula y el periodo.';
      return;
    }

    this.guardando = true;
    this.errorModal = null;
    this.cdr.markForCheck();

    const dto: BulkAsignarAuxiliarDto = {
      auxiliarId: Number(this.formAuxiliarId),
      aulaIds: this.formAulaIds,
      periodoLectivo: this.formPeriodo.trim()
    };

    this.asigSvc.bulkAsignar(dto).subscribe({
      next: () => {
        this.guardando = false;
        this.modal = false;
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.errorModal = err?.error?.mensaje ?? 'Error al procesar asignaciones.';
        this.cdr.markForCheck();
      }
    });
  }

  eliminarAsignacion(id: number): void {
    this.asigSvc.delete(id).subscribe({
      next: () => this.cargar()
    });
  }
}
