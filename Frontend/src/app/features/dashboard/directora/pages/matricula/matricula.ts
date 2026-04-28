import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatriculaService,
  EstudianteDetalleDto,
  CreateEstudianteDto,
  UpdateEstudianteDto,
  PadreComboDto,
  PadreDetalleDto,
} from '../../../../../core/services/matricula';
import {
  EstructuraService,
  AulaDetalleDto,
} from '../../../../../core/services/estructura';

@Component({
  selector: 'app-matricula',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './matricula.html',
  styleUrl: './matricula.scss',
})
export class Matricula implements OnInit {
  private svc = inject(MatriculaService);
  private estructuraSvc = inject(EstructuraService);
  private cdr = inject(ChangeDetectorRef);

  // ── Lista ─────────────────────────────────────────────────
  estudiantes: EstudianteDetalleDto[] = [];
  estudiantesFiltrados: EstudianteDetalleDto[] = [];
  loading = true;
  errorLoad: string | null = null;
  busqueda = '';
  filtroAula: string = '';

  // ── Combos ────────────────────────────────────────────────
  aulas: AulaDetalleDto[] = [];
  padres: PadreComboDto[] = [];

  // ── Modal Registrar/Editar ─────────────────────────────────
  modalForm = false;
  modoEdicion = false;
  estudianteEditandoId: number | null = null;

  form: CreateEstudianteDto = {
    dni: '', nombres: '', apellidos: '',
    correo: null, telefono: null,
    aulaId: null, padreId: null
  };
  errorForm: string | null = null;
  guardando = false;

  // ── Búsqueda de padre por DNI ──────────────────────────────
  dniPadreBusqueda = '';
  padreEncontrado: PadreDetalleDto | null = null;
  buscandoPadre = false;
  errorBusquedaPadre: string | null = null;

  // ── Confirmar eliminar ─────────────────────────────────────
  confirmEliminarId: number | null = null;

  ngOnInit(): void {
    this.cargar();
    this.cargarCombos();
  }

  cargar(): void {
    this.loading = true;
    this.errorLoad = null;
    this.svc.getAll().subscribe({
      next: (data) => {
        this.estudiantes = data;
        this.filtrar();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorLoad = `Error ${err?.status}: No se pudieron cargar los estudiantes.`;
        this.cdr.markForCheck();
      },
    });
  }

  cargarCombos(): void {
    this.estructuraSvc.getAulasDetalle().subscribe({
      next: (data) => {
        this.aulas = data.filter(a => a.estado === 1);
        this.cdr.markForCheck();
      },
    });
    this.svc.getPadresCombo().subscribe({
      next: (data) => {
        this.padres = data;
        this.cdr.markForCheck();
      },
    });
  }

  filtrar(): void {
    let lista = [...this.estudiantes];
    const q = this.busqueda.toLowerCase().trim();
    if (q) {
      lista = lista.filter(e =>
        e.nombres.toLowerCase().includes(q) ||
        e.apellidos.toLowerCase().includes(q) ||
        e.dni.includes(q)
      );
    }
    if (this.filtroAula) {
      lista = lista.filter(e =>
        e.aulaId !== null &&
        `${e.gradoNombre} ${e.seccionLetra}`.toLowerCase().includes(this.filtroAula.toLowerCase())
      );
    }
    this.estudiantesFiltrados = lista;
  }

  get totalActivos(): number { return this.estudiantes.filter(e => e.estado === 1).length; }
  get totalSinAula(): number { return this.estudiantes.filter(e => !e.aulaId).length; }

  onBusqueda(): void { this.filtrar(); }
  onFiltroAula(): void { this.filtrar(); }
  nombreCompleto(e: EstudianteDetalleDto): string { return `${e.nombres} ${e.apellidos}`; }
  aulaLabel(a: AulaDetalleDto): string { return `${a.gradoNombre} - Sec. ${a.seccionLetra}`; }

  // ── Modal ─────────────────────────────────────────────────
  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.estudianteEditandoId = null;
    this.form = { dni: '', nombres: '', apellidos: '', correo: null, telefono: null, aulaId: null, padreId: null };
    this.errorForm = null;
    this.dniPadreBusqueda = '';
    this.padreEncontrado = null;
    this.errorBusquedaPadre = null;
    this.modalForm = true;
    this.cdr.markForCheck();
  }

  abrirModalEditar(e: EstudianteDetalleDto): void {
    this.modoEdicion = true;
    this.estudianteEditandoId = e.id;
    this.form = {
      dni: e.dni, nombres: e.nombres, apellidos: e.apellidos,
      correo: e.correo, telefono: e.telefono,
      aulaId: e.aulaId, padreId: e.padreId
    };
    this.errorForm = null;
    this.dniPadreBusqueda = e.padreNombre ? (e.padreCorreo ?? '') : '';
    // Reconstruimos padreEncontrado mínimo para mostrar el nombre en edición
    this.padreEncontrado = e.padreId ? {
      id: e.padreId,
      dni: '',
      nombres: e.padreNombre?.split(' ')[0] ?? '',
      apellidos: e.padreNombre?.split(' ').slice(1).join(' ') ?? '',
      correo: e.padreCorreo,
      telefono: null,
      estado: 1
    } : null;
    this.errorBusquedaPadre = null;
    this.modalForm = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void {
    this.modalForm = false;
    this.padreEncontrado = null;
    this.dniPadreBusqueda = '';
    this.errorBusquedaPadre = null;
    this.cdr.markForCheck();
  }

  // ── Búsqueda de padre por DNI ──────────────────────────────
  buscarPadre(): void {
    if (this.dniPadreBusqueda.trim().length < 4) {
      this.errorBusquedaPadre = 'Ingrese al menos 4 dígitos del DNI.';
      return;
    }
    this.buscandoPadre = true;
    this.padreEncontrado = null;
    this.errorBusquedaPadre = null;
    this.form.padreId = null;

    this.svc.buscarPadrePorDni(this.dniPadreBusqueda.trim()).subscribe({
      next: (padre) => {
        this.padreEncontrado = padre;
        this.form.padreId = padre.id;
        this.buscandoPadre = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.buscandoPadre = false;
        this.errorBusquedaPadre = err?.status === 404
          ? 'No se encontró ningún padre con ese DNI.'
          : 'Error al buscar. Verifica la conexión.';
        this.cdr.markForCheck();
      },
    });
  }

  limpiarPadre(): void {
    this.padreEncontrado = null;
    this.form.padreId = null;
    this.dniPadreBusqueda = '';
    this.errorBusquedaPadre = null;
    this.cdr.markForCheck();
  }

  guardar(): void {
    if (!this.form.dni.trim() || !this.form.nombres.trim() || !this.form.apellidos.trim()) {
      this.errorForm = 'DNI, nombres y apellidos son requeridos.';
      return;
    }
    if (this.form.dni.length !== 8) {
      this.errorForm = 'El DNI debe tener exactamente 8 dígitos.';
      return;
    }
    this.guardando = true;
    this.errorForm = null;

    const onOk = () => {
      this.guardando = false;
      this.cerrarModal();
      this.cargar();
    };
    const onErr = (err: any) => {
      this.guardando = false;
      this.errorForm = err?.error?.mensaje ?? 'Error al guardar.';
      this.cdr.markForCheck();
    };

    if (this.modoEdicion) {
      const dto: UpdateEstudianteDto = {
        nombres: this.form.nombres.trim(),
        apellidos: this.form.apellidos.trim(),
        correo: this.form.correo?.trim() || null,
        telefono: this.form.telefono?.trim() || null,
        aulaId: this.form.aulaId ? Number(this.form.aulaId) : null,
        padreId: this.form.padreId ? Number(this.form.padreId) : null,
      };
      this.svc.update(this.estudianteEditandoId!, dto).subscribe({ next: onOk, error: onErr });
    } else {
      const dto: CreateEstudianteDto = {
        ...this.form,
        dni: this.form.dni.trim(),
        nombres: this.form.nombres.trim(),
        apellidos: this.form.apellidos.trim(),
        correo: this.form.correo?.trim() || null,
        telefono: this.form.telefono?.trim() || null,
        aulaId: this.form.aulaId ? Number(this.form.aulaId) : null,
        padreId: this.form.padreId ? Number(this.form.padreId) : null,
      };
      this.svc.create(dto).subscribe({ next: onOk, error: onErr });
    }
  }

  toggleEstado(e: EstudianteDetalleDto): void {
    this.svc.toggleEstado(e.id).subscribe({
      next: (res) => { e.estado = res.estado; this.cdr.markForCheck(); },
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
