import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DocentesService,
  DocenteDetalleDto,
  CreateDocenteDto,
  UpdateDocenteDto,
} from '../../../../../core/services/docentes';

@Component({
  selector: 'app-personal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal.html',
  styleUrl: './personal.scss',
})
export class Personal implements OnInit {
  private svc = inject(DocentesService);
  private cdr = inject(ChangeDetectorRef);

  // ── Tab activo ─────────────────────────────────────────────
  activeTab: 'docentes' | 'auxiliares' | 'admin' = 'docentes';
  setTab(tab: 'docentes' | 'auxiliares' | 'admin'): void {
    this.activeTab = tab;
    if (tab === 'docentes' && this.docentes.length === 0) this.cargar();
  }

  // ── Lista Docentes ─────────────────────────────────────────
  docentes: DocenteDetalleDto[] = [];
  docentesFiltrados: DocenteDetalleDto[] = [];
  loading = true;
  errorLoad: string | null = null;
  busqueda = '';

  // ── Modal Crear ────────────────────────────────────────────
  modalCrear = false;
  formCrear: CreateDocenteDto = { dni: '', nombres: '', apellidos: '', telefono: null };
  errorCrear: string | null = null;
  guardandoCrear = false;
  credencialesGeneradas: { correo: string; clave: string } | null = null;

  // ── Modal Editar ───────────────────────────────────────────
  modalEditar = false;
  docenteEditandoId: number | null = null;
  formEditar: UpdateDocenteDto = { nombres: '', apellidos: '', correo: null, telefono: null };
  errorEditar: string | null = null;
  guardandoEditar = false;

  // ── Modal Cambiar Clave ────────────────────────────────────
  modalClave = false;
  docenteClaveId: number | null = null;
  docenteClaveNombre = '';
  nuevaClave = '';
  mostrarClave = false;
  errorClave: string | null = null;
  guardandoClave = false;

  // ── Confirmar eliminar ─────────────────────────────────────
  confirmEliminarId: number | null = null;

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true;
    this.errorLoad = null;
    this.svc.getAll().subscribe({
      next: (data) => {
        this.docentes = data;
        this.filtrar();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorLoad = `Error ${err?.status}: No se pudieron cargar los docentes.`;
        this.cdr.markForCheck();
      },
    });
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.docentesFiltrados = q
      ? this.docentes.filter(d =>
          d.nombres.toLowerCase().includes(q) ||
          d.apellidos.toLowerCase().includes(q) ||
          d.dni.includes(q)
        )
      : [...this.docentes];
  }

  onBusqueda(): void { this.filtrar(); }
  nombreCompleto(d: DocenteDetalleDto): string { return `${d.nombres} ${d.apellidos}`; }
  get totalActivos(): number { return this.docentes.filter(d => d.estado === 1).length; }

  // ── Modal Crear ──────────────────────────────────────────
  abrirModalCrear(): void {
    this.formCrear = { dni: '', nombres: '', apellidos: '', telefono: null };
    this.errorCrear = null;
    this.credencialesGeneradas = null;
    this.modalCrear = true;
    this.cdr.markForCheck();
  }

  cerrarModalCrear(): void {
    this.modalCrear = false;
    this.credencialesGeneradas = null;
    this.cdr.markForCheck();
  }

  crearDocente(): void {
    if (!this.formCrear.dni.trim() || !this.formCrear.nombres.trim() || !this.formCrear.apellidos.trim()) {
      this.errorCrear = 'DNI, nombres y apellidos son requeridos.';
      return;
    }
    if (this.formCrear.dni.length !== 8) {
      this.errorCrear = 'El DNI debe tener exactamente 8 dígitos.';
      return;
    }
    this.guardandoCrear = true;
    this.errorCrear = null;

    this.svc.create(this.formCrear).subscribe({
      next: (res) => {
        this.guardandoCrear = false;
        this.credencialesGeneradas = { correo: res.correo, clave: res.claveGenerada };
        this.cargar();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardandoCrear = false;
        this.errorCrear = err?.error?.mensaje ?? 'Error al registrar el docente.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Modal Editar ──────────────────────────────────────────
  abrirModalEditar(d: DocenteDetalleDto): void {
    this.docenteEditandoId = d.id;
    this.formEditar = { nombres: d.nombres, apellidos: d.apellidos, correo: d.correo, telefono: d.telefono };
    this.errorEditar = null;
    this.modalEditar = true;
    this.cdr.markForCheck();
  }

  cerrarModalEditar(): void { this.modalEditar = false; this.cdr.markForCheck(); }

  guardarEdicion(): void {
    if (!this.formEditar.nombres.trim() || !this.formEditar.apellidos.trim()) {
      this.errorEditar = 'Nombres y apellidos son requeridos.';
      return;
    }
    this.guardandoEditar = true;
    this.errorEditar = null;
    this.cdr.markForCheck();

    this.svc.update(this.docenteEditandoId!, this.formEditar).subscribe({
      next: () => {
        // Actualiza el ítem en la lista local sin recargar toda la lista
        const idx = this.docentes.findIndex(d => d.id === this.docenteEditandoId);
        if (idx !== -1) {
          this.docentes[idx] = {
            ...this.docentes[idx],
            nombres: this.formEditar.nombres.trim(),
            apellidos: this.formEditar.apellidos.trim(),
            correo: this.formEditar.correo?.trim() || this.docentes[idx].correo,
            telefono: this.formEditar.telefono?.trim() || null,
          };
          this.filtrar();
        }
        this.guardandoEditar = false;
        this.modalEditar = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.guardandoEditar = false;
        this.errorEditar = err?.error?.mensaje ?? 'Error al actualizar.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Modal Clave ───────────────────────────────────────────
  abrirModalClave(d: DocenteDetalleDto): void {
    this.docenteClaveId = d.id;
    this.docenteClaveNombre = `${d.nombres} ${d.apellidos}`;
    this.nuevaClave = '';
    this.mostrarClave = false;
    this.errorClave = null;
    this.modalClave = true;
    this.cdr.markForCheck();
  }

  cerrarModalClave(): void { this.modalClave = false; this.cdr.markForCheck(); }

  guardarClave(): void {
    if (!this.nuevaClave.trim() || this.nuevaClave.length < 4) {
      this.errorClave = 'La contraseña debe tener al menos 4 caracteres.';
      return;
    }
    this.guardandoClave = true;
    this.errorClave = null;
    this.cdr.markForCheck();

    this.svc.cambiarClave(this.docenteClaveId!, this.nuevaClave.trim()).subscribe({
      next: () => {
        this.guardandoClave = false;
        this.modalClave = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.guardandoClave = false;
        this.errorClave = err?.error?.mensaje ?? 'Error al cambiar la contraseña.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Toggle y Eliminar ─────────────────────────────────────
  toggleEstado(d: DocenteDetalleDto): void {
    this.svc.toggleEstado(d.id).subscribe({
      next: (res) => { d.estado = res.estado; this.cdr.markForCheck(); },
    });
  }

  pedirEliminar(id: number): void { this.confirmEliminarId = id; this.cdr.markForCheck(); }
  cancelarEliminar(): void { this.confirmEliminarId = null; this.cdr.markForCheck(); }
  confirmarEliminar(): void {
    if (this.confirmEliminarId === null) return;
    this.svc.delete(this.confirmEliminarId).subscribe({
      next: () => { this.confirmEliminarId = null; this.cargar(); },
    });
  }
}
