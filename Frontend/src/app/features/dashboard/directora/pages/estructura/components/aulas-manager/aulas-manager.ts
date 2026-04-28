import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EstructuraService,
  AulaDetalleDto,
  GradoSimpleDto,
  SeccionSimpleDto,
  CreateAulaDto,
  UpdateAulaDto,
} from '../../../../../../../core/services/estructura';

@Component({
  selector: 'app-aulas-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './aulas-manager.html',
  styleUrl: './aulas-manager.scss',
})
export class AulasManager implements OnInit {
  private svc = inject(EstructuraService);
  private cdr = inject(ChangeDetectorRef);

  // ── Estado general
  aulas: AulaDetalleDto[] = [];
  aulasFiltradas: AulaDetalleDto[] = [];
  loading = true;
  errorMsg: string | null = null;
  busqueda = '';

  // ── Dropdowns
  grados: GradoSimpleDto[] = [];
  secciones: SeccionSimpleDto[] = [];

  // ── Modal
  modalAbierto = false;
  modoEdicion = false;
  aulaEditandoId: number | null = null;
  guardando = false;
  errorModal: string | null = null;

  form = {
    gradoId: 0,
    seccionId: 0,
    descripcion: '',
    capacidad: 30,
  };

  // ── Confirmación eliminar
  confirmEliminarId: number | null = null;

  ngOnInit(): void {
    this.cargarAulas();
    this.cargarDropdowns();
  }

  cargarAulas(): void {
    this.loading = true;
    this.errorMsg = null;
    this.svc.getAulasDetalle().subscribe({
      next: (data) => {
        this.aulas = data;
        this.filtrar();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMsg = 'Error al cargar las aulas. Verifica la conexión con el servidor.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cargarDropdowns(): void {
    this.svc.getDropdowns().subscribe({
      next: (data) => {
        this.grados = data.grados;
        this.secciones = data.secciones;
        this.cdr.markForCheck();
      },
    });
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.aulasFiltradas = q
      ? this.aulas.filter(
          (a) =>
            a.gradoNombre.toLowerCase().includes(q) ||
            a.seccionLetra.toLowerCase().includes(q) ||
            (a.descripcion ?? '').toLowerCase().includes(q)
        )
      : [...this.aulas];
  }

  onBusqueda(): void {
    this.filtrar();
  }

  // ── Modal crear
  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.aulaEditandoId = null;
    this.errorModal = null;
    this.form = { gradoId: this.grados[0]?.id ?? 0, seccionId: this.secciones[0]?.id ?? 0, descripcion: '', capacidad: 30 };
    this.modalAbierto = true;
    this.cdr.detectChanges();
  }

  // ── Modal editar
  abrirModalEditar(aula: AulaDetalleDto): void {
    this.modoEdicion = true;
    this.aulaEditandoId = aula.id;
    this.errorModal = null;
    this.form = {
      gradoId: aula.gradoId,
      seccionId: aula.seccionId,
      descripcion: aula.descripcion ?? '',
      capacidad: aula.capacidad,
    };
    this.modalAbierto = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.cdr.detectChanges();
  }

  guardar(): void {
    if (!this.form.gradoId || !this.form.seccionId || this.form.capacidad < 1) {
      this.errorModal = 'Completa todos los campos requeridos.';
      return;
    }
    this.guardando = true;
    this.errorModal = null;

    const dto = {
      gradoId: Number(this.form.gradoId),
      seccionId: Number(this.form.seccionId),
      descripcion: this.form.descripcion || null,
      capacidad: this.form.capacidad,
    };

    const onSuccess = () => {
      this.guardando = false;
      this.cerrarModal();
      this.cargarAulas();
    };

    const onError = (err: any) => {
      this.guardando = false;
      this.errorModal = err?.error?.mensaje ?? 'Error al guardar. Intenta de nuevo.';
      this.cdr.detectChanges();
    };

    if (this.modoEdicion) {
      this.svc.updateAula(this.aulaEditandoId!, dto).subscribe({ next: onSuccess, error: onError });
    } else {
      this.svc.createAula(dto).subscribe({ next: onSuccess, error: onError });
    }
  }


  // ── Toggle estado
  toggleEstado(aula: AulaDetalleDto): void {
    this.svc.toggleEstado(aula.id).subscribe({
      next: (res) => {
        aula.estado = res.estado;
        this.filtrar();
        this.cdr.markForCheck();
      },
    });
  }

  // ── Eliminar lógico
  pedirConfirmarEliminar(id: number): void {
    this.confirmEliminarId = id;
    this.cdr.detectChanges();
  }

  cancelarEliminar(): void {
    this.confirmEliminarId = null;
    this.cdr.detectChanges();
  }

  confirmarEliminar(): void {
    if (this.confirmEliminarId === null) return;
    this.svc.deleteAula(this.confirmEliminarId).subscribe({
      next: () => {
        this.confirmEliminarId = null;
        this.cargarAulas();
      },
    });
  }
}

