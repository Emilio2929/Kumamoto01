import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PadresService,
  PadreDetalleDto,
  CreatePadreDto,
  UpdatePadreDto,
} from '../../../../../core/services/padres';

@Component({
  selector: 'app-padres',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './padres.html',
  styleUrl: './padres.scss',
})
export class Padres implements OnInit {
  private svc = inject(PadresService);
  private cdr = inject(ChangeDetectorRef);

  // ── Lista ─────────────────────────────────────────────────
  padres: PadreDetalleDto[] = [];
  padresFiltrados: PadreDetalleDto[] = [];
  loading = true;
  errorLoad: string | null = null;
  busqueda = '';

  // ── Modal Crear ────────────────────────────────────────────
  modalCrear = false;
  formCrear: CreatePadreDto = { dni: '', nombres: '', apellidos: '', correo: '', telefono: null };

  errorCrear: string | null = null;
  guardandoCrear = false;
  credencialesGeneradas: { correo: string; clave: string } | null = null;

  // ── Modal Editar ───────────────────────────────────────────
  modalEditar = false;
  padreEditandoId: number | null = null;
  formEditar: UpdatePadreDto = { nombres: '', apellidos: '', correo: null, telefono: null };
  errorEditar: string | null = null;
  guardandoEditar = false;

  // ── Modal Cambiar Clave ────────────────────────────────────
  modalClave = false;
  padreClaveId: number | null = null;
  padreClaveNombre = '';
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
        this.padres = data;
        this.filtrar();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorLoad = `Error ${err?.status}: No se pudieron cargar los padres.`;
        this.cdr.markForCheck();
      },
    });
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.padresFiltrados = q
      ? this.padres.filter(p =>
          p.nombres.toLowerCase().includes(q) ||
          p.apellidos.toLowerCase().includes(q) ||
          p.dni.includes(q) ||
          (p.correo ?? '').toLowerCase().includes(q)
        )
      : [...this.padres];
  }

  onBusqueda(): void { this.filtrar(); }
  nombreCompleto(p: PadreDetalleDto): string { return `${p.nombres} ${p.apellidos}`; }

  // ── Modal Crear ───────────────────────────────────────────
  abrirModalCrear(): void {
    this.formCrear = { dni: '', nombres: '', apellidos: '', correo: '', telefono: null };

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

  crearPadre(): void {
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
        this.errorCrear = err?.error?.mensaje ?? 'Error al registrar el padre.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Modal Editar ──────────────────────────────────────────
  abrirModalEditar(p: PadreDetalleDto): void {
    this.padreEditandoId = p.id;
    this.formEditar = { nombres: p.nombres, apellidos: p.apellidos, correo: p.correo, telefono: p.telefono };
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

    this.svc.update(this.padreEditandoId!, this.formEditar).subscribe({
      next: () => {
        this.guardandoEditar = false;
        this.cerrarModalEditar();
        this.cargar();
      },
      error: (err) => {
        this.guardandoEditar = false;
        this.errorEditar = err?.error?.mensaje ?? 'Error al actualizar.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Modal Cambiar Clave ──────────────────────────────────
  abrirModalClave(p: PadreDetalleDto): void {
    this.padreClaveId = p.id;
    this.padreClaveNombre = `${p.nombres} ${p.apellidos}`;
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

    this.svc.cambiarClave(this.padreClaveId!, this.nuevaClave.trim()).subscribe({
      next: () => {
        this.guardandoClave = false;
        this.cerrarModalClave();
      },
      error: (err) => {
        this.guardandoClave = false;
        this.errorClave = err?.error?.mensaje ?? 'Error al cambiar la contraseña.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Toggle y Eliminar ─────────────────────────────────────
  toggleEstado(p: PadreDetalleDto): void {
    this.svc.toggleEstado(p.id).subscribe({
      next: (res) => { p.estado = res.estado; this.cdr.markForCheck(); },
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
