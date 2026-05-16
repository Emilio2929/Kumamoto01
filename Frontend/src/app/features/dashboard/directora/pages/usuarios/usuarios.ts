import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DocentesService, DocenteDetalleDto, CreateDocenteDto, UpdateDocenteDto,
} from '../../../../../core/services/docentes';
import {
  AuxiliaresAdminService, AuxiliarDetalleDto, CreateAuxiliarDto, UpdateAuxiliarDto,
} from '../../../../../core/services/auxiliares-admin';
import {
  AdministrativosService, AdministrativoDetalleDto, CreateAdministrativoDto, UpdateAdministrativoDto,
} from '../../../../../core/services/administrativos';
import {
  PadresService, PadreDetalleDto,
} from '../../../../../core/services/padres';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
  private docentesSvc = inject(DocentesService);
  private auxSvc = inject(AuxiliaresAdminService);
  private adminSvc = inject(AdministrativosService);
  private padresSvc = inject(PadresService);
  private cdr = inject(ChangeDetectorRef);

  // ── Tab activo ─────────────────────────────────────────────
  activeTab: 'docentes' | 'auxiliares' | 'admin' | 'padres' = 'docentes';

  setTab(tab: 'docentes' | 'auxiliares' | 'admin' | 'padres'): void {
    this.activeTab = tab;
    if (tab === 'docentes' && this.docentes.length === 0) this.cargarDocentes();
    if (tab === 'auxiliares' && this.auxiliares.length === 0) this.cargarAuxiliares();
    if (tab === 'admin' && this.administrativos.length === 0) this.cargarAdmin();
    if (tab === 'padres' && this.padres.length === 0) this.cargarPadres();
  }

  // ── Modales de Verificación (Eliminar, Activar/Desactivar, Editar) ──
  confirmEliminarId: number | null = null;
  confirmEliminarTipo: 'docente' | 'auxiliar' | 'admin' = 'docente';

  confirmEstadoId: number | null = null;
  confirmEstadoTipo: 'docente' | 'auxiliar' | 'admin' | null = null;
  confirmEstadoActual: number = 0;

  confirmGuardarEdicionTipo: 'docente' | 'auxiliar' | 'admin' | null = null;

  // ══════════════════════════════════════════════════════════
  //  DOCENTES
  // ══════════════════════════════════════════════════════════
  docentes: DocenteDetalleDto[] = [];
  docentesFiltrados: DocenteDetalleDto[] = [];
  loadingDocentes = true;
  errorDocentes: string | null = null;
  busquedaDocentes = '';

  modalCrearDocente = false;
  formCrearDocente: CreateDocenteDto = { dni: '', nombres: '', apellidos: '', correoPersonal: null, telefono: null };
  errorCrearDocente: string | null = null;
  guardandoCrearDocente = false;
  credencialesDocente: { correo: string; clave: string } | null = null;

  modalEditarDocente = false;
  docenteEditandoId: number | null = null;
  docenteEditando: DocenteDetalleDto | null = null;
  formEditarDocente: UpdateDocenteDto = { nombres: '', apellidos: '', correoPersonal: null, telefono: null };
  errorEditarDocente: string | null = null;
  guardandoEditarDocente = false;

  modalClaveDocente = false;
  docenteClaveId: number | null = null;
  docenteClaveNombre = '';
  nuevaClaveDocente = '';
  errorClaveDocente: string | null = null;
  guardandoClaveDocente = false;

  // ══════════════════════════════════════════════════════════
  //  AUXILIARES
  // ══════════════════════════════════════════════════════════
  auxiliares: AuxiliarDetalleDto[] = [];
  auxiliaresFiltrados: AuxiliarDetalleDto[] = [];
  loadingAux = false;
  errorAux: string | null = null;
  busquedaAux = '';

  modalCrearAux = false;
  formCrearAux: CreateAuxiliarDto = { dni: '', nombres: '', apellidos: '', correoPersonal: null, telefono: null };
  errorCrearAux: string | null = null;
  guardandoCrearAux = false;
  credencialesAux: { correo: string; clave: string } | null = null;

  modalEditarAux = false;
  auxEditandoId: number | null = null;
  auxEditando: AuxiliarDetalleDto | null = null;
  formEditarAux: UpdateAuxiliarDto = { nombres: '', apellidos: '', correoPersonal: null, telefono: null };
  errorEditarAux: string | null = null;
  guardandoEditarAux = false;

  modalClaveAux = false;
  auxClaveId: number | null = null;
  auxClaveNombre = '';
  nuevaClaveAux = '';
  errorClaveAux: string | null = null;
  guardandoClaveAux = false;

  // ══════════════════════════════════════════════════════════
  //  ADMINISTRATIVOS (Directivos)
  // ══════════════════════════════════════════════════════════
  administrativos: AdministrativoDetalleDto[] = [];
  administrativosFiltrados: AdministrativoDetalleDto[] = [];
  loadingAdmin = false;
  errorAdmin: string | null = null;
  busquedaAdmin = '';

  modalCrearAdmin = false;
  formCrearAdmin: CreateAdministrativoDto = { dni: '', nombres: '', apellidos: '', correoPersonal: null, telefono: null };
  errorCrearAdmin: string | null = null;
  guardandoCrearAdmin = false;
  credencialesAdmin: { correo: string; clave: string } | null = null;

  modalEditarAdmin = false;
  adminEditandoId: number | null = null;
  adminEditando: AdministrativoDetalleDto | null = null;
  formEditarAdmin: UpdateAdministrativoDto = { nombres: '', apellidos: '', correoPersonal: null, telefono: null };
  errorEditarAdmin: string | null = null;
  guardandoEditarAdmin = false;

  modalClaveAdmin = false;
  adminClaveId: number | null = null;
  adminClaveNombre = '';
  nuevaClaveAdmin = '';
  errorClaveAdmin: string | null = null;
  guardandoClaveAdmin = false;

  // ══════════════════════════════════════════════════════════
  //  PADRES (Solo lectura/Credenciales)
  // ══════════════════════════════════════════════════════════
  padres: PadreDetalleDto[] = [];
  padresFiltrados: PadreDetalleDto[] = [];
  loadingPadres = false;
  errorPadres: string | null = null;
  busquedaPadres = '';

  modalClavePadre = false;
  padreClaveId: number | null = null;
  padreClaveNombre = '';
  nuevaClavePadre = '';
  errorClavePadre: string | null = null;
  guardandoClavePadre = false;


  ngOnInit(): void {
    this.cargarDocentes();
  }

  // ─────────────────────────────────────────────────────────────────
  //  MÉTODOS DOCENTES
  // ─────────────────────────────────────────────────────────────────
  cargarDocentes(): void {
    this.loadingDocentes = true; this.errorDocentes = null;
    this.docentesSvc.getAll().subscribe({
      next: (data) => { this.docentes = data; this.filtrarDocentes(); this.loadingDocentes = false; this.cdr.markForCheck(); },
      error: (err) => { this.loadingDocentes = false; this.errorDocentes = 'Error al cargar docentes.'; this.cdr.markForCheck(); }
    });
  }
  filtrarDocentes(): void {
    const q = this.busquedaDocentes.toLowerCase().trim();
    this.docentesFiltrados = q ? this.docentes.filter(d => d.nombres.toLowerCase().includes(q) || d.apellidos.toLowerCase().includes(q) || d.dni.includes(q)) : [...this.docentes];
  }
  onBusquedaDocentes(): void { this.filtrarDocentes(); }

  abrirModalCrearDocente(): void {
    this.formCrearDocente = { dni: '', nombres: '', apellidos: '', correoPersonal: null, telefono: null };
    this.errorCrearDocente = null; this.credencialesDocente = null; this.modalCrearDocente = true; this.cdr.markForCheck();
  }
  crearDocente(): void {
    if (!this.formCrearDocente.dni.trim() || !this.formCrearDocente.nombres.trim() || !this.formCrearDocente.apellidos.trim()) {
      this.errorCrearDocente = 'Requerido: DNI, Nombres y Apellidos.'; return;
    }
    this.guardandoCrearDocente = true; this.errorCrearDocente = null;
    this.docentesSvc.create(this.formCrearDocente).subscribe({
      next: (res) => { this.guardandoCrearDocente = false; this.credencialesDocente = { correo: res.correo, clave: res.claveGenerada }; this.cargarDocentes(); this.cdr.markForCheck(); },
      error: (err) => { this.guardandoCrearDocente = false; this.errorCrearDocente = err?.error?.mensaje || 'Error al crear.'; this.cdr.markForCheck(); }
    });
  }

  abrirModalEditarDocente(d: DocenteDetalleDto): void {
    this.docenteEditandoId = d.id;
    this.docenteEditando = d;
    this.formEditarDocente = { nombres: d.nombres, apellidos: d.apellidos, correoPersonal: d.correoPersonal, telefono: d.telefono };
    this.errorEditarDocente = null; this.modalEditarDocente = true; this.cdr.markForCheck();
  }
  guardarEdicionDocente(): void {
    if (!this.formEditarDocente.nombres.trim() || !this.formEditarDocente.apellidos.trim()) {
      this.errorEditarDocente = 'Requerido: Nombres y Apellidos.'; return;
    }
    // Cierra el modal anterior y abre el de confirmación (Lógica limpia sin foco anidado)
    this.modalEditarDocente = false;
    this.confirmGuardarEdicionTipo = 'docente';
    this.cdr.markForCheck();
  }

  abrirModalClaveDocente(d: DocenteDetalleDto): void {
    this.docenteClaveId = d.id; this.docenteClaveNombre = `${d.nombres} ${d.apellidos}`;
    this.nuevaClaveDocente = ''; this.errorClaveDocente = null; this.modalClaveDocente = true; this.cdr.markForCheck();
  }
  guardarClaveDocente(): void {
    if (this.nuevaClaveDocente.length < 4) { this.errorClaveDocente = 'Mínimo 4 caracteres.'; return; }
    this.guardandoClaveDocente = true; this.errorClaveDocente = null;
    this.docentesSvc.cambiarClave(this.docenteClaveId!, this.nuevaClaveDocente).subscribe({
      next: () => { this.guardandoClaveDocente = false; this.modalClaveDocente = false; this.cdr.markForCheck(); },
      error: (err) => { this.guardandoClaveDocente = false; this.errorClaveDocente = err?.error?.mensaje || 'Error al cambiar clave.'; this.cdr.markForCheck(); }
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  MÉTODOS AUXILIARES
  // ─────────────────────────────────────────────────────────────────
  cargarAuxiliares(): void {
    this.loadingAux = true; this.errorAux = null;
    this.auxSvc.getAll().subscribe({
      next: (data) => { this.auxiliares = data; this.filtrarAux(); this.loadingAux = false; this.cdr.markForCheck(); },
      error: (err) => { this.loadingAux = false; this.errorAux = 'Error al cargar auxiliares.'; this.cdr.markForCheck(); }
    });
  }
  filtrarAux(): void {
    const q = this.busquedaAux.toLowerCase().trim();
    this.auxiliaresFiltrados = q ? this.auxiliares.filter(a => a.nombres.toLowerCase().includes(q) || a.apellidos.toLowerCase().includes(q) || a.dni.includes(q)) : [...this.auxiliares];
  }
  onBusquedaAux(): void { this.filtrarAux(); }

  abrirModalCrearAux(): void {
    this.formCrearAux = { dni: '', nombres: '', apellidos: '', correoPersonal: null, telefono: null };
    this.errorCrearAux = null; this.credencialesAux = null; this.modalCrearAux = true; this.cdr.markForCheck();
  }
  crearAuxiliar(): void {
    if (!this.formCrearAux.dni.trim() || !this.formCrearAux.nombres.trim() || !this.formCrearAux.apellidos.trim()) {
      this.errorCrearAux = 'Requerido: DNI, Nombres y Apellidos.'; return;
    }
    this.guardandoCrearAux = true; this.errorCrearAux = null;
    this.auxSvc.create(this.formCrearAux).subscribe({
      next: (res) => { this.guardandoCrearAux = false; this.credencialesAux = { correo: res.correo, clave: res.claveGenerada }; this.cargarAuxiliares(); this.cdr.markForCheck(); },
      error: (err) => { this.guardandoCrearAux = false; this.errorCrearAux = err?.error?.mensaje || 'Error al crear.'; this.cdr.markForCheck(); }
    });
  }

  abrirModalEditarAux(a: AuxiliarDetalleDto): void {
    this.auxEditandoId = a.id;
    this.auxEditando = a;
    this.formEditarAux = { nombres: a.nombres, apellidos: a.apellidos, correoPersonal: a.correoPersonal, telefono: a.telefono };
    this.errorEditarAux = null; this.modalEditarAux = true; this.cdr.markForCheck();
  }
  guardarEdicionAux(): void {
    if (!this.formEditarAux.nombres.trim() || !this.formEditarAux.apellidos.trim()) {
      this.errorEditarAux = 'Requerido: Nombres y Apellidos.'; return;
    }
    // Cierra el modal anterior y abre el de confirmación
    this.modalEditarAux = false;
    this.confirmGuardarEdicionTipo = 'auxiliar';
    this.cdr.markForCheck();
  }

  abrirModalClaveAux(a: AuxiliarDetalleDto): void {
    this.auxClaveId = a.id; this.auxClaveNombre = `${a.nombres} ${a.apellidos}`;
    this.nuevaClaveAux = ''; this.errorClaveAux = null; this.modalClaveAux = true; this.cdr.markForCheck();
  }
  guardarClaveAux(): void {
    if (this.nuevaClaveAux.length < 4) { this.errorClaveAux = 'Mínimo 4 caracteres.'; return; }
    this.guardandoClaveAux = true; this.errorClaveAux = null;
    this.auxSvc.cambiarClave(this.auxClaveId!, this.nuevaClaveAux).subscribe({
      next: () => { this.guardandoClaveAux = false; this.modalClaveAux = false; this.cdr.markForCheck(); },
      error: (err) => { this.guardandoClaveAux = false; this.errorClaveAux = err?.error?.mensaje || 'Error al cambiar clave.'; this.cdr.markForCheck(); }
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  MÉTODOS ADMINISTRATIVOS
  // ─────────────────────────────────────────────────────────────────
  cargarAdmin(): void {
    this.loadingAdmin = true; this.errorAdmin = null;
    this.adminSvc.getAll().subscribe({
      next: (data) => { this.administrativos = data; this.filtrarAdmin(); this.loadingAdmin = false; this.cdr.markForCheck(); },
      error: (err) => { this.loadingAdmin = false; this.errorAdmin = 'Error al cargar directivos.'; this.cdr.markForCheck(); }
    });
  }
  filtrarAdmin(): void {
    const q = this.busquedaAdmin.toLowerCase().trim();
    this.administrativosFiltrados = q ? this.administrativos.filter(a => a.nombres.toLowerCase().includes(q) || a.apellidos.toLowerCase().includes(q) || a.dni.includes(q)) : [...this.administrativos];
  }
  onBusquedaAdmin(): void { this.filtrarAdmin(); }

  abrirModalCrearAdmin(): void {
    this.formCrearAdmin = { dni: '', nombres: '', apellidos: '', correoPersonal: null, telefono: null };
    this.errorCrearAdmin = null; this.credencialesAdmin = null; this.modalCrearAdmin = true; this.cdr.markForCheck();
  }
  crearAdmin(): void {
    if (!this.formCrearAdmin.dni.trim() || !this.formCrearAdmin.nombres.trim() || !this.formCrearAdmin.apellidos.trim()) {
      this.errorCrearAdmin = 'Requerido: DNI, Nombres y Apellidos.'; return;
    }
    this.guardandoCrearAdmin = true; this.errorCrearAdmin = null;
    this.adminSvc.create(this.formCrearAdmin).subscribe({
      next: (res) => { this.guardandoCrearAdmin = false; this.credencialesAdmin = { correo: res.correo, clave: res.claveGenerada }; this.cargarAdmin(); this.cdr.markForCheck(); },
      error: (err) => { this.guardandoCrearAdmin = false; this.errorCrearAdmin = err?.error?.mensaje || 'Error al crear.'; this.cdr.markForCheck(); }
    });
  }

  abrirModalEditarAdmin(a: AdministrativoDetalleDto): void {
    this.adminEditandoId = a.id;
    this.adminEditando = a;
    this.formEditarAdmin = { nombres: a.nombres, apellidos: a.apellidos, correoPersonal: a.correoPersonal, telefono: a.telefono };
    this.errorEditarAdmin = null; this.modalEditarAdmin = true; this.cdr.markForCheck();
  }
  guardarEdicionAdmin(): void {
    if (!this.formEditarAdmin.nombres.trim() || !this.formEditarAdmin.apellidos.trim()) {
      this.errorEditarAdmin = 'Requerido: Nombres y Apellidos.'; return;
    }
    // Cierra el modal anterior y abre el de confirmación
    this.modalEditarAdmin = false;
    this.confirmGuardarEdicionTipo = 'admin';
    this.cdr.markForCheck();
  }

  abrirModalClaveAdmin(a: AdministrativoDetalleDto): void {
    this.adminClaveId = a.id; this.adminClaveNombre = `${a.nombres} ${a.apellidos}`;
    this.nuevaClaveAdmin = ''; this.errorClaveAdmin = null; this.modalClaveAdmin = true; this.cdr.markForCheck();
  }
  guardarClaveAdmin(): void {
    if (this.nuevaClaveAdmin.length < 4) { this.errorClaveAdmin = 'Mínimo 4 caracteres.'; return; }
    this.guardandoClaveAdmin = true; this.errorClaveAdmin = null;
    this.adminSvc.cambiarClave(this.adminClaveId!, this.nuevaClaveAdmin).subscribe({
      next: () => { this.guardandoClaveAdmin = false; this.modalClaveAdmin = false; this.cdr.markForCheck(); },
      error: (err) => { this.guardandoClaveAdmin = false; this.errorClaveAdmin = err?.error?.mensaje || 'Error al cambiar clave.'; this.cdr.markForCheck(); }
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  MÉTODOS PADRES (Solo vista de credenciales)
  // ─────────────────────────────────────────────────────────────────
  cargarPadres(): void {
    this.loadingPadres = true; this.errorPadres = null;
    this.padresSvc.getAll().subscribe({
      next: (data) => { this.padres = data; this.filtrarPadres(); this.loadingPadres = false; this.cdr.markForCheck(); },
      error: (err) => { this.loadingPadres = false; this.errorPadres = 'Error al cargar padres.'; this.cdr.markForCheck(); }
    });
  }
  filtrarPadres(): void {
    const q = this.busquedaPadres.toLowerCase().trim();
    this.padresFiltrados = q ? this.padres.filter(p => p.nombres.toLowerCase().includes(q) || p.apellidos.toLowerCase().includes(q) || p.dni.includes(q)) : [...this.padres];
  }
  onBusquedaPadres(): void { this.filtrarPadres(); }

  abrirModalClavePadre(p: PadreDetalleDto): void {
    this.padreClaveId = p.id; this.padreClaveNombre = `${p.nombres} ${p.apellidos}`;
    this.nuevaClavePadre = ''; this.errorClavePadre = null; this.modalClavePadre = true; this.cdr.markForCheck();
  }
  guardarClavePadre(): void {
    if (this.nuevaClavePadre.length < 4) { this.errorClavePadre = 'Mínimo 4 caracteres.'; return; }
    this.guardandoClavePadre = true; this.errorClavePadre = null;
    this.padresSvc.cambiarClave(this.padreClaveId!, this.nuevaClavePadre).subscribe({
      next: () => { this.guardandoClavePadre = false; this.modalClavePadre = false; this.cdr.markForCheck(); },
      error: (err) => { this.guardandoClavePadre = false; this.errorClavePadre = err?.error?.mensaje || 'Error al cambiar clave.'; this.cdr.markForCheck(); }
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  MÉTODOS DE CONFIRMACIÓN / EJECUCIÓN (MODALES)
  // ─────────────────────────────────────────────────────────────────

  // 1. ELIMINAR
  pedirEliminar(id: number, tipo: 'docente'|'auxiliar'|'admin'): void {
    this.confirmEliminarId = id; this.confirmEliminarTipo = tipo; this.cdr.markForCheck();
  }
  confirmarEliminar(): void {
    if (this.confirmEliminarId === null) return;
    if (this.confirmEliminarTipo === 'docente') {
      this.docentesSvc.delete(this.confirmEliminarId).subscribe({ next: () => { this.confirmEliminarId = null; this.cargarDocentes(); } });
    } else if (this.confirmEliminarTipo === 'auxiliar') {
      this.auxSvc.delete(this.confirmEliminarId).subscribe({ next: () => { this.confirmEliminarId = null; this.cargarAuxiliares(); } });
    } else {
      this.adminSvc.delete(this.confirmEliminarId).subscribe({ next: () => { this.confirmEliminarId = null; this.cargarAdmin(); } });
    }
  }

  // 2. TOGGLE ESTADO (ACTIVAR / DESACTIVAR)
  pedirToggleEstado(id: number, tipo: 'docente'|'auxiliar'|'admin', estadoActual: number): void {
    this.confirmEstadoId = id;
    this.confirmEstadoTipo = tipo;
    this.confirmEstadoActual = estadoActual;
    this.cdr.markForCheck();
  }

  ejecutarToggleEstado(): void {
    if (this.confirmEstadoId === null) return;
    if (this.confirmEstadoTipo === 'docente') {
      this.docentesSvc.toggleEstado(this.confirmEstadoId).subscribe({
        next: () => { this.confirmEstadoId = null; this.confirmEstadoTipo = null; this.cargarDocentes(); }
      });
    } else if (this.confirmEstadoTipo === 'auxiliar') {
      this.auxSvc.toggleEstado(this.confirmEstadoId).subscribe({
        next: () => { this.confirmEstadoId = null; this.confirmEstadoTipo = null; this.cargarAuxiliares(); }
      });
    } else if (this.confirmEstadoTipo === 'admin') {
      this.adminSvc.toggleEstado(this.confirmEstadoId).subscribe({
        next: () => { this.confirmEstadoId = null; this.confirmEstadoTipo = null; this.cargarAdmin(); }
      });
    }
  }

  // 3. GUARDAR EDICIÓN (LÓGICA SIMPLE SIN FOCO ANIDADO)
  cancelarGuardarEdicion(): void {
    if (this.confirmGuardarEdicionTipo === 'docente') {
      this.modalEditarDocente = true;
    } else if (this.confirmGuardarEdicionTipo === 'auxiliar') {
      this.modalEditarAux = true;
    } else if (this.confirmGuardarEdicionTipo === 'admin') {
      this.modalEditarAdmin = true;
    }
    this.confirmGuardarEdicionTipo = null;
    this.cdr.markForCheck();
  }

  ejecutarGuardarEdicion(): void {
    if (this.confirmGuardarEdicionTipo === 'docente') {
      this.guardandoEditarDocente = true;
      this.cdr.markForCheck();
      this.docentesSvc.update(this.docenteEditandoId!, this.formEditarDocente).subscribe({
        next: () => {
          this.guardandoEditarDocente = false;
          this.confirmGuardarEdicionTipo = null;
          this.cargarDocentes();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.guardandoEditarDocente = false;
          this.confirmGuardarEdicionTipo = null;
          this.errorEditarDocente = err?.error?.mensaje || 'Error al actualizar.';
          this.modalEditarDocente = true;
          this.cdr.markForCheck();
        }
      });
    } else if (this.confirmGuardarEdicionTipo === 'auxiliar') {
      this.guardandoEditarAux = true;
      this.cdr.markForCheck();
      this.auxSvc.update(this.auxEditandoId!, this.formEditarAux).subscribe({
        next: () => {
          this.guardandoEditarAux = false;
          this.confirmGuardarEdicionTipo = null;
          this.cargarAuxiliares();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.guardandoEditarAux = false;
          this.confirmGuardarEdicionTipo = null;
          this.errorEditarAux = err?.error?.mensaje || 'Error al actualizar.';
          this.modalEditarAux = true;
          this.cdr.markForCheck();
        }
      });
    } else if (this.confirmGuardarEdicionTipo === 'admin') {
      this.guardandoEditarAdmin = true;
      this.cdr.markForCheck();
      this.adminSvc.update(this.adminEditandoId!, this.formEditarAdmin).subscribe({
        next: () => {
          this.guardandoEditarAdmin = false;
          this.confirmGuardarEdicionTipo = null;
          this.cargarAdmin();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.guardandoEditarAdmin = false;
          this.confirmGuardarEdicionTipo = null;
          this.errorEditarAdmin = err?.error?.mensaje || 'Error al actualizar.';
          this.modalEditarAdmin = true;
          this.cdr.markForCheck();
        }
      });
    }
  }
}
