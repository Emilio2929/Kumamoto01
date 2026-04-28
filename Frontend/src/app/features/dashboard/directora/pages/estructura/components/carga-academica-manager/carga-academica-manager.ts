import {
  Component, OnInit, inject,
  ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CargaAcademicaService,
  CargaAcademicaDetalleDto,
  AsignarDocenteDto,
  HorarioDto,
  DocenteComboItem,
} from '../../../../../../../core/services/carga-academica';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

@Component({
  selector: 'app-carga-academica-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './carga-academica-manager.html',
  styleUrl: './carga-academica-manager.scss',
})
export class CargaAcademicaManager implements OnInit {
  private svc = inject(CargaAcademicaService);
  private cdr = inject(ChangeDetectorRef);

  readonly dias = DIAS;

  // ── Lista ─────────────────────────────────────────────────
  cargas: CargaAcademicaDetalleDto[] = [];
  cargasFiltradas: CargaAcademicaDetalleDto[] = [];
  loading = true;
  errorLoad: string | null = null;
  busqueda = '';
  filtroGrado = '';

  // ── Combos ────────────────────────────────────────────────
  docentes: DocenteComboItem[] = [];

  // ── Modal Asignar ─────────────────────────────────────────
  modal = false;
  cargaSeleccionada: CargaAcademicaDetalleDto | null = null;

  formDocenteId: number | null = null;
  formPeriodo = '';
  formHorarios: HorarioDto[] = [];

  errorModal: string | null = null;
  guardando = false;

  // ── Confirmar quitar ──────────────────────────────────────
  confirmQuitarId: number | null = null;

  ngOnInit(): void {
    this.cargar();
    this.cargarDocentes();
  }

  cargar(): void {
    this.loading = true;
    this.errorLoad = null;
    this.svc.getAll().subscribe({
      next: (data) => {
        this.cargas = data;
        this.filtrar();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorLoad = `Error ${err?.status}: No se pudo cargar la carga académica.`;
        this.cdr.markForCheck();
      },
    });
  }

  cargarDocentes(): void {
    this.svc.getDocentesCombo().subscribe({
      next: (data) => { this.docentes = data; this.cdr.markForCheck(); },
    });
  }

  filtrar(): void {
    let lista = [...this.cargas];
    const q = this.busqueda.toLowerCase().trim();
    if (q) {
      lista = lista.filter(c =>
        c.cursoNombre.toLowerCase().includes(q) ||
        c.gradoNombre.toLowerCase().includes(q) ||
        (c.docenteNombre ?? '').toLowerCase().includes(q)
      );
    }
    if (this.filtroGrado) {
      lista = lista.filter(c => c.gradoNombre === this.filtroGrado);
    }
    this.cargasFiltradas = lista;
  }

  get gradosUnicos(): string[] {
    return [...new Set(this.cargas.map(c => c.gradoNombre))].sort();
  }

  get totalAsignados(): number { return this.cargas.filter(c => c.docenteId).length; }
  get totalSinDocente(): number { return this.cargas.filter(c => !c.docenteId).length; }

  horarioLabel(h: HorarioDto): string {
    return `${h.diaSemana} ${h.horaInicio}–${h.horaFin}`;
  }

  // ── Modal ─────────────────────────────────────────────────
  abrirModal(c: CargaAcademicaDetalleDto): void {
    this.cargaSeleccionada = c;
    this.formDocenteId = c.docenteId ?? null;
    this.formPeriodo = c.periodoLectivo ?? '';
    this.formHorarios = c.horarios.length > 0
      ? c.horarios.map(h => ({ ...h }))
      : [{ diaSemana: 'Lunes', horaInicio: '08:00', horaFin: '09:00' }];
    this.errorModal = null;
    this.modal = true;
    this.cdr.markForCheck();
  }

  cerrarModal(): void { this.modal = false; this.cdr.markForCheck(); }

  agregarBloque(): void {
    this.formHorarios = [
      ...this.formHorarios,
      { diaSemana: 'Lunes', horaInicio: '08:00', horaFin: '09:00' }
    ];
    this.cdr.markForCheck();
  }

  quitarBloque(i: number): void {
    this.formHorarios = this.formHorarios.filter((_, idx) => idx !== i);
    this.cdr.markForCheck();
  }

  guardar(): void {
    if (this.formHorarios.length === 0) {
      this.errorModal = 'Debe agregar al menos un bloque horario.';
      this.cdr.markForCheck();
      return;
    }
    for (const h of this.formHorarios) {
      if (!h.horaInicio || !h.horaFin || h.horaInicio >= h.horaFin) {
        this.errorModal = `El bloque del ${h.diaSemana} tiene horas inválidas.`;
        this.cdr.markForCheck();
        return;
      }
    }

    this.guardando = true;
    this.errorModal = null;
    this.cdr.markForCheck();

    const dto: AsignarDocenteDto = {
      docenteId: this.formDocenteId ? Number(this.formDocenteId) : null,
      periodoLectivo: this.formPeriodo.trim() || null,
      horarios: this.formHorarios,
    };

    this.svc.asignarDocente(this.cargaSeleccionada!.id, dto).subscribe({
      next: () => {
        const idx = this.cargas.findIndex(c => c.id === this.cargaSeleccionada!.id);
        if (idx !== -1) {
          const docente = this.docentes.find(d => d.id === dto.docenteId);
          this.cargas[idx] = {
            ...this.cargas[idx],
            docenteId: dto.docenteId,
            docenteNombre: docente?.nombreCompleto ?? null,
            periodoLectivo: dto.periodoLectivo,
            horarios: [...this.formHorarios],
          };
          this.filtrar();
        }
        this.guardando = false;
        this.modal = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.guardando = false;
        this.errorModal = err?.error?.mensaje ?? 'Error al guardar la asignación.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Quitar docente ────────────────────────────────────────
  pedirQuitar(id: number): void { this.confirmQuitarId = id; this.cdr.markForCheck(); }
  cancelarQuitar(): void { this.confirmQuitarId = null; this.cdr.markForCheck(); }

  confirmarQuitar(): void {
    if (this.confirmQuitarId === null) return;
    this.svc.quitarDocente(this.confirmQuitarId).subscribe({
      next: () => {
        const idx = this.cargas.findIndex(c => c.id === this.confirmQuitarId);
        if (idx !== -1) {
          this.cargas[idx] = {
            ...this.cargas[idx],
            docenteId: null, docenteNombre: null,
            periodoLectivo: null, horarios: [],
          };
          this.filtrar();
        }
        this.confirmQuitarId = null;
        this.cdr.markForCheck();
      },
    });
  }
}
