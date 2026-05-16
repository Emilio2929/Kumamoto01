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
  PadresService,
  PadreDetalleDto as PadreFullDto,
  CreatePadreDto,
  UpdatePadreDto,
} from '../../../../../core/services/padres';
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
  private padresSvc = inject(PadresService);
  private estructuraSvc = inject(EstructuraService);
  private cdr = inject(ChangeDetectorRef);

  // ── Tab principal ──────────────────────────────────────────
  activeTab: 'estudiantes' | 'padres' | 'registro' = 'estudiantes';

  // ══════════════════════════════════════════════════════════
  //  TAB: ESTUDIANTES
  // ══════════════════════════════════════════════════════════
  estudiantes: EstudianteDetalleDto[] = [];
  estudiantesFiltrados: EstudianteDetalleDto[] = [];
  loading = true;
  errorLoad: string | null = null;
  busqueda = '';
  filtroAula: string = '';
  aulas: AulaDetalleDto[] = [];
  padres: PadreComboDto[] = [];

  // ── Modal Editar Estudiante ────────────────────────────────
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

  // ── Búsqueda de padre por DNI (dentro del modal editar) ───
  dniPadreBusqueda = '';
  padreEncontrado: PadreDetalleDto | null = null;
  buscandoPadre = false;
  errorBusquedaPadre: string | null = null;

  // ── Confirmar eliminar ─────────────────────────────────────
  confirmEliminarId: number | null = null;
  confirmEliminarTipo: 'estudiante' | 'padre' = 'estudiante';

  // ══════════════════════════════════════════════════════════
  //  TAB: PADRES
  // ══════════════════════════════════════════════════════════
  padresLista: PadreFullDto[] = [];
  padresFiltrados: PadreFullDto[] = [];
  loadingPadres = false;
  errorLoadPadres: string | null = null;
  busquedaPadres = '';

  // ── Modal Editar Padre ─────────────────────────────────────
  modalEditarPadre = false;
  padreEditandoId: number | null = null;
  formEditarPadre: UpdatePadreDto = { nombres: '', apellidos: '', correo: null, telefono: null };
  errorEditarPadre: string | null = null;
  guardandoEditarPadre = false;

  // ── Modal Cambiar Clave Padre ──────────────────────────────
  modalClavePadre = false;
  padreClaveId: number | null = null;
  padreClaveNombre = '';
  nuevaClavePadre = '';
  mostrarClavePadre = false;
  errorClavePadre: string | null = null;
  guardandoClavePadre = false;

  // ── Confirmar guardado ──────────────────────────────────────
  confirmGuardarTipo: 'estudiante' | 'padre' | null = null;

  // ══════════════════════════════════════════════════════════
  //  TAB: NUEVO REGISTRO (Wizard)
  // ══════════════════════════════════════════════════════════
  wizardStep: 1 | 2 | 3 = 1;
  wizardMode: 'select' | 'nuevo' | 'existente' = 'select';

  // Búsqueda de padre existente (modo 'existente')
  dniPadreWizard = '';
  buscandoPadreWizard = false;
  padreExistenteEncontrado: PadreDetalleDto | null = null;
  errorBusquedaWizard: string | null = null;

  // Paso 1: Registro del padre (modo 'nuevo')
  formPadre: CreatePadreDto = { dni: '', nombres: '', apellidos: '', correo: '', telefono: null };
  errorPadre: string | null = null;
  guardandoPadre = false;
  padreRegistradoId: number | null = null;
  credencialesPadre: { correo: string; clave: string } | null = null;

  // Paso 2: Registro del estudiante
  formEstudiante: CreateEstudianteDto = {
    dni: '', nombres: '', apellidos: '',
    correo: null, telefono: null,
    aulaId: null, padreId: null
  };
  errorEstudiante: string | null = null;
  guardandoEstudiante = false;
  estudianteRegistrado = false;

  // ══════════════════════════════════════════════════════════
  //  LIFECYCLE
  // ══════════════════════════════════════════════════════════
  ngOnInit(): void {
    this.cargar();
    this.cargarCombos();
  }

  setTab(tab: 'estudiantes' | 'padres' | 'registro'): void {
    this.activeTab = tab;
    if (tab === 'padres' && this.padresLista.length === 0) this.cargarPadres();
    if (tab === 'registro') this.resetWizard();
  }

  // ══════════════════════════════════════════════════════════
  //  ESTUDIANTES
  // ══════════════════════════════════════════════════════════
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
      next: (data) => { this.padres = data; this.cdr.markForCheck(); },
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

  // ── Modal Editar Estudiante ────────────────────────────────
  abrirModalEditar(e: EstudianteDetalleDto): void {
    this.modoEdicion = true;
    this.estudianteEditandoId = e.id;
    this.form = {
      dni: e.dni, nombres: e.nombres, apellidos: e.apellidos,
      correo: e.correo, telefono: e.telefono,
      aulaId: e.aulaId, padreId: e.padreId
    };
    this.errorForm = null;
    this.dniPadreBusqueda = '';
    this.padreEncontrado = e.padreId ? {
      id: e.padreId, dni: '', nombres: e.padreNombre?.split(' ')[0] ?? '',
      apellidos: e.padreNombre?.split(' ').slice(1).join(' ') ?? '',
      correo: e.padreCorreo, telefono: null, estado: 1
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

  guardarEstudianteEdit(): void {
    if (!this.form.nombres.trim() || !this.form.apellidos.trim()) {
      this.errorForm = 'Nombres y apellidos son requeridos.';
      return;
    }
    this.guardando = true;
    this.errorForm = null;
    const dto: UpdateEstudianteDto = {
      nombres: this.form.nombres.trim(),
      apellidos: this.form.apellidos.trim(),
      correo: this.form.correo?.trim() || null,
      telefono: this.form.telefono?.trim() || null,
      aulaId: this.form.aulaId ? Number(this.form.aulaId) : null,
      padreId: this.form.padreId ? Number(this.form.padreId) : null,
    };
    this.svc.update(this.estudianteEditandoId!, dto).subscribe({
      next: () => { this.guardando = false; this.cerrarModal(); this.cargar(); },
      error: (err) => {
        this.guardando = false;
        this.errorForm = err?.error?.mensaje ?? 'Error al guardar.';
        this.cdr.markForCheck();
      },
    });
  }

  toggleEstado(e: EstudianteDetalleDto): void {
    this.svc.toggleEstado(e.id).subscribe({
      next: (res) => { e.estado = res.estado; this.cdr.markForCheck(); },
    });
  }

  pedirEliminar(id: number): void {
    this.confirmEliminarId = id;
    this.confirmEliminarTipo = 'estudiante';
    this.cdr.markForCheck();
  }
  cancelarEliminar(): void { this.confirmEliminarId = null; this.cdr.markForCheck(); }
  confirmarEliminar(): void {
    if (this.confirmEliminarId === null) return;
    if (this.confirmEliminarTipo === 'estudiante') {
      this.svc.delete(this.confirmEliminarId).subscribe({
        next: () => { this.confirmEliminarId = null; this.cargar(); },
      });
    } else {
      this.padresSvc.delete(this.confirmEliminarId).subscribe({
        next: () => { this.confirmEliminarId = null; this.cargarPadres(); },
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  PADRES LIST
  // ══════════════════════════════════════════════════════════
  cargarPadres(): void {
    this.loadingPadres = true;
    this.errorLoadPadres = null;
    this.padresSvc.getAll().subscribe({
      next: (data) => {
        this.padresLista = data;
        this.filtrarPadres();
        this.loadingPadres = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingPadres = false;
        this.errorLoadPadres = `Error ${err?.status}: No se pudieron cargar los padres.`;
        this.cdr.markForCheck();
      },
    });
  }

  filtrarPadres(): void {
    const q = this.busquedaPadres.toLowerCase().trim();
    this.padresFiltrados = q
      ? this.padresLista.filter(p =>
          p.nombres.toLowerCase().includes(q) ||
          p.apellidos.toLowerCase().includes(q) ||
          p.dni.includes(q) ||
          (p.correo ?? '').toLowerCase().includes(q)
        )
      : [...this.padresLista];
  }

  onBusquedaPadres(): void { this.filtrarPadres(); }

  abrirModalEditarPadre(p: PadreFullDto): void {
    this.padreEditandoId = p.id;
    this.formEditarPadre = { nombres: p.nombres, apellidos: p.apellidos, correo: p.correoPersonal, telefono: p.telefono };
    this.errorEditarPadre = null;
    this.modalEditarPadre = true;
    this.cdr.markForCheck();
  }

  cerrarModalEditarPadre(): void { this.modalEditarPadre = false; this.cdr.markForCheck(); }

  guardarEdicionPadre(): void {
    if (!this.formEditarPadre.nombres.trim() || !this.formEditarPadre.apellidos.trim()) {
      this.errorEditarPadre = 'Nombres y apellidos son requeridos.';
      return;
    }
    this.guardandoEditarPadre = true;
    this.errorEditarPadre = null;
    this.padresSvc.update(this.padreEditandoId!, this.formEditarPadre).subscribe({
      next: () => { this.guardandoEditarPadre = false; this.cerrarModalEditarPadre(); this.cargarPadres(); },
      error: (err) => {
        this.guardandoEditarPadre = false;
        this.errorEditarPadre = err?.error?.mensaje ?? 'Error al actualizar.';
        this.cdr.markForCheck();
      },
    });
  }

  abrirModalClavePadre(p: PadreFullDto): void {
    this.padreClaveId = p.id;
    this.padreClaveNombre = `${p.nombres} ${p.apellidos}`;
    this.nuevaClavePadre = '';
    this.mostrarClavePadre = false;
    this.errorClavePadre = null;
    this.modalClavePadre = true;
    this.cdr.markForCheck();
  }

  cerrarModalClavePadre(): void { this.modalClavePadre = false; this.cdr.markForCheck(); }

  guardarClavePadre(): void {
    if (!this.nuevaClavePadre.trim() || this.nuevaClavePadre.length < 4) {
      this.errorClavePadre = 'La contraseña debe tener al menos 4 caracteres.';
      return;
    }
    this.guardandoClavePadre = true;
    this.errorClavePadre = null;
    this.padresSvc.cambiarClave(this.padreClaveId!, this.nuevaClavePadre.trim()).subscribe({
      next: () => { this.guardandoClavePadre = false; this.cerrarModalClavePadre(); },
      error: (err) => {
        this.guardandoClavePadre = false;
        this.errorClavePadre = err?.error?.mensaje ?? 'Error al cambiar la contraseña.';
        this.cdr.markForCheck();
      },
    });
  }

  toggleEstadoPadre(p: PadreFullDto): void {
    this.padresSvc.toggleEstado(p.id).subscribe({
      next: (res) => { p.estado = res.estado; this.cdr.markForCheck(); },
    });
  }

  pedirEliminarPadre(id: number): void {
    this.confirmEliminarId = id;
    this.confirmEliminarTipo = 'padre';
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════════════════
  //  WIZARD: NUEVO REGISTRO
  // ══════════════════════════════════════════════════════════
  resetWizard(): void {
    this.wizardStep = 1;
    this.wizardMode = 'select';
    this.dniPadreWizard = '';
    this.buscandoPadreWizard = false;
    this.padreExistenteEncontrado = null;
    this.errorBusquedaWizard = null;
    this.formPadre = { dni: '', nombres: '', apellidos: '', correo: '', telefono: null };
    this.errorPadre = null;
    this.guardandoPadre = false;
    this.padreRegistradoId = null;
    this.credencialesPadre = null;
    this.formEstudiante = { dni: '', nombres: '', apellidos: '', correo: null, telefono: null, aulaId: null, padreId: null };
    this.errorEstudiante = null;
    this.guardandoEstudiante = false;
    this.estudianteRegistrado = false;
  }

  seleccionarModo(modo: 'nuevo' | 'existente'): void {
    this.wizardMode = modo;
    this.cdr.markForCheck();
  }

  buscarPadreWizard(): void {
    if (this.dniPadreWizard.trim().length < 8) {
      this.errorBusquedaWizard = 'Ingrese los 8 dígitos del DNI.';
      return;
    }
    this.buscandoPadreWizard = true;
    this.padreExistenteEncontrado = null;
    this.errorBusquedaWizard = null;
    this.svc.buscarPadrePorDni(this.dniPadreWizard.trim()).subscribe({
      next: (padre) => {
        this.padreExistenteEncontrado = padre;
        this.buscandoPadreWizard = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.buscandoPadreWizard = false;
        this.errorBusquedaWizard = err?.status === 404
          ? 'No se encontró un padre con ese DNI. Regístrelo primero.'
          : 'Error al buscar.';
        this.cdr.markForCheck();
      },
    });
  }

  usarPadreExistente(): void {
    if (!this.padreExistenteEncontrado) return;
    this.padreRegistradoId = this.padreExistenteEncontrado.id;
    this.formEstudiante.padreId = this.padreExistenteEncontrado.id;
    this.credencialesPadre = null; // no se generan credenciales nuevas
    this.wizardStep = 2;
    this.cdr.markForCheck();
  }

  registrarPadre(): void {
    if (!this.formPadre.dni.trim() || !this.formPadre.nombres.trim() || !this.formPadre.apellidos.trim()) {
      this.errorPadre = 'DNI, nombres y apellidos son requeridos.';
      return;
    }
    if (this.formPadre.dni.length !== 8) {
      this.errorPadre = 'El DNI debe tener exactamente 8 dígitos.';
      return;
    }
    this.guardandoPadre = true;
    this.errorPadre = null;
    this.padresSvc.create(this.formPadre).subscribe({
      next: (res) => {
        this.guardandoPadre = false;
        this.padreRegistradoId = res.id;
        this.credencialesPadre = { correo: res.correo, clave: res.claveGenerada };
        this.formEstudiante.padreId = res.id;
        this.wizardStep = 2;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardandoPadre = false;
        this.errorPadre = err?.error?.mensaje ?? 'Error al registrar el padre.';
        this.cdr.markForCheck();
      },
    });
  }

  registrarEstudiante(): void {
    if (!this.formEstudiante.dni.trim() || !this.formEstudiante.nombres.trim() || !this.formEstudiante.apellidos.trim()) {
      this.errorEstudiante = 'DNI, nombres y apellidos son requeridos.';
      return;
    }
    if (this.formEstudiante.dni.length !== 8) {
      this.errorEstudiante = 'El DNI debe tener exactamente 8 dígitos.';
      return;
    }
    this.guardandoEstudiante = true;
    this.errorEstudiante = null;
    const dto: CreateEstudianteDto = {
      ...this.formEstudiante,
      dni: this.formEstudiante.dni.trim(),
      nombres: this.formEstudiante.nombres.trim(),
      apellidos: this.formEstudiante.apellidos.trim(),
      correo: this.formEstudiante.correo?.trim() || null,
      telefono: this.formEstudiante.telefono?.trim() || null,
      aulaId: this.formEstudiante.aulaId ? Number(this.formEstudiante.aulaId) : null,
      padreId: this.padreRegistradoId,
    };
    this.svc.create(dto).subscribe({
      next: () => {
        this.guardandoEstudiante = false;
        this.estudianteRegistrado = true;
        this.wizardStep = 3;
        this.cargar();
        this.cargarPadres();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardandoEstudiante = false;
        this.errorEstudiante = err?.error?.mensaje ?? 'Error al registrar el estudiante.';
        this.cdr.markForCheck();
      },
    });
  }

  finalizarRegistro(): void {
    this.activeTab = 'estudiantes';
    this.resetWizard();
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════════════════
  //  CONFIRMAR GUARDADO
  // ══════════════════════════════════════════════════════════
  pedirConfirmarGuardado(tipo: 'estudiante' | 'padre'): void {
    this.confirmGuardarTipo = tipo;
    this.cdr.markForCheck();
  }

  ejecutarGuardado(): void {
    const tipo = this.confirmGuardarTipo;
    this.confirmGuardarTipo = null;
    if (tipo === 'estudiante') {
      this.guardarEstudianteEdit();
    } else if (tipo === 'padre') {
      this.guardarEdicionPadre();
    }
  }
}
