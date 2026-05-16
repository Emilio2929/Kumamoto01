import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DocentesService,
  DocenteDetalleDto,
  CreateDocenteDto,
  UpdateDocenteDto,
} from '../../../../../core/services/docentes';
import {
  AuxiliaresAdminService,
  AuxiliarDetalleDto,
  CreateAuxiliarDto,
  UpdateAuxiliarDto,
} from '../../../../../core/services/auxiliares-admin';
import {
  AdministrativosService,
  AdministrativoDetalleDto,
  CreateAdministrativoDto,
  UpdateAdministrativoDto,
} from '../../../../../core/services/administrativos';


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
  private auxSvc = inject(AuxiliaresAdminService);
  private adminSvc = inject(AdministrativosService);
  private cdr = inject(ChangeDetectorRef);


  // ── Tab activo ─────────────────────────────────────────────
  activeTab: 'docentes' | 'auxiliares' | 'admin' = 'docentes';
  setTab(tab: 'docentes' | 'auxiliares' | 'admin'): void {
    this.activeTab = tab;
    if (tab === 'docentes' && this.docentes.length === 0) this.cargar();
    if (tab === 'auxiliares' && this.auxiliares.length === 0) this.cargarAuxiliares();
    if (tab === 'admin' && this.administrativos.length === 0) this.cargarAdmin();
  }


  // ── Lista Docentes ─────────────────────────────────────────
  docentes: DocenteDetalleDto[] = [];
  docentesFiltrados: DocenteDetalleDto[] = [];
  loading = true;
  errorLoad: string | null = null;
  busqueda = '';

  // ── Modal Crear ────────────────────────────────────────────
  modalCrear = false;
  formCrear: CreateDocenteDto = { dni: '', nombres: '', apellidos: '', correoPersonal: null, telefono: null };
  errorCrear: string | null = null;
  guardandoCrear = false;
  credencialesGeneradas: { correo: string; clave: string } | null = null;

  // ── Modal Editar ───────────────────────────────────────────
  modalEditar = false;
  docenteEditandoId: number | null = null;
  docenteEditando: DocenteDetalleDto | null = null;
  formEditar: UpdateDocenteDto = { nombres: '', apellidos: '', correoPersonal: null, telefono: null };
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
  confirmEliminarTipo: 'docente' | 'auxiliar' | 'administrativo' = 'docente';


  // ── Gestión Auxiliares ─────────────────────────────────────
  auxiliares: AuxiliarDetalleDto[] = [];
  auxiliaresFiltrados: AuxiliarDetalleDto[] = [];
  loadingAux = false;
  errorLoadAux: string | null = null;
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
  mostrarClaveAux = false;
  errorClaveAux: string | null = null;
  guardandoClaveAux = false;

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
    this.formCrear = { dni: '', nombres: '', apellidos: '', correoPersonal: null, telefono: null };
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
    this.docenteEditando = d;
    this.formEditar = { nombres: d.nombres, apellidos: d.apellidos, correoPersonal: d.correoPersonal, telefono: d.telefono };
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
            correoPersonal: this.formEditar.correoPersonal?.trim() || this.docentes[idx].correoPersonal,
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

  pedirEliminar(id: number): void { 
    this.confirmEliminarId = id; 
    this.confirmEliminarTipo = 'docente';
    this.cdr.markForCheck(); 
  }
  
  pedirEliminarAux(id: number): void {
    this.confirmEliminarId = id;
    this.confirmEliminarTipo = 'auxiliar';
    this.cdr.markForCheck();
  }

  pedirEliminarAdmin(id: number): void {
    this.confirmEliminarId = id;
    this.confirmEliminarTipo = 'administrativo';
    this.cdr.markForCheck();
  }

  cancelarEliminar(): void { this.confirmEliminarId = null; this.cdr.markForCheck(); }

  
  confirmarEliminar(): void {
    if (this.confirmEliminarId === null) return;
    
    if (this.confirmEliminarTipo === 'docente') {
      this.svc.delete(this.confirmEliminarId).subscribe({
        next: () => { this.confirmEliminarId = null; this.cargar(); },
      });
    } else if (this.confirmEliminarTipo === 'auxiliar') {
      this.auxSvc.delete(this.confirmEliminarId).subscribe({
        next: () => { this.confirmEliminarId = null; this.cargarAuxiliares(); },
      });
    } else {
      this.adminSvc.delete(this.confirmEliminarId).subscribe({
        next: () => { this.confirmEliminarId = null; this.cargarAdmin(); },
      });
    }
  }


  // ── Lógica Auxiliares ───────────────────────────────────────
  cargarAuxiliares(): void {
    this.loadingAux = true;
    this.errorLoadAux = null;
    this.auxSvc.getAll().subscribe({
      next: (data) => {
        this.auxiliares = data;
        this.filtrarAux();
        this.loadingAux = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingAux = false;
        this.errorLoadAux = `Error ${err?.status}: No se pudieron cargar los auxiliares.`;
        this.cdr.markForCheck();
      },
    });
  }

  filtrarAux(): void {
    const q = this.busquedaAux.toLowerCase().trim();
    this.auxiliaresFiltrados = q
      ? this.auxiliares.filter(a =>
          a.nombres.toLowerCase().includes(q) ||
          a.apellidos.toLowerCase().includes(q) ||
          a.dni.includes(q)
        )
      : [...this.auxiliares];
  }

  onBusquedaAux(): void { this.filtrarAux(); }

  abrirModalCrearAux(): void {
    this.formCrearAux = { dni: '', nombres: '', apellidos: '', correoPersonal: null, telefono: null };

    this.errorCrearAux = null;
    this.credencialesAux = null;
    this.modalCrearAux = true;
    this.cdr.markForCheck();
  }

  cerrarModalCrearAux(): void {
    this.modalCrearAux = false;
    this.credencialesAux = null;
    this.cdr.markForCheck();
  }

  crearAuxiliar(): void {
    if (!this.formCrearAux.dni.trim() || !this.formCrearAux.nombres.trim() || !this.formCrearAux.apellidos.trim()) {
      this.errorCrearAux = 'DNI, nombres y apellidos son requeridos.';
      return;
    }

    this.guardandoCrearAux = true;
    this.errorCrearAux = null;

    this.auxSvc.create(this.formCrearAux).subscribe({
      next: (res) => {
        this.guardandoCrearAux = false;
        this.credencialesAux = { correo: res.correo, clave: res.claveGenerada };
        this.cargarAuxiliares();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardandoCrearAux = false;
        this.errorCrearAux = err?.error?.mensaje ?? 'Error al registrar.';
        this.cdr.markForCheck();
      },
    });
  }

  abrirModalEditarAux(a: AuxiliarDetalleDto): void {
    this.auxEditandoId = a.id;
    this.auxEditando = a;
    this.formEditarAux = { nombres: a.nombres, apellidos: a.apellidos, correoPersonal: a.correoPersonal, telefono: a.telefono };
    this.errorEditarAux = null;
    this.modalEditarAux = true;
    this.cdr.markForCheck();
  }

  cerrarModalEditarAux(): void { this.modalEditarAux = false; this.cdr.markForCheck(); }

  guardarEdicionAux(): void {
    if (!this.formEditarAux.nombres.trim() || !this.formEditarAux.apellidos.trim()) {
      this.errorEditarAux = 'Nombres y apellidos son requeridos.';
      return;
    }
    this.guardandoEditarAux = true;
    this.errorEditarAux = null;
    this.auxSvc.update(this.auxEditandoId!, this.formEditarAux).subscribe({
      next: () => {
        this.cargarAuxiliares();
        this.guardandoEditarAux = false;
        this.modalEditarAux = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardandoEditarAux = false;
        this.errorEditarAux = err?.error?.mensaje ?? 'Error al actualizar.';
        this.cdr.markForCheck();
      },
    });
  }

  abrirModalClaveAux(a: AuxiliarDetalleDto): void {
    this.auxClaveId = a.id;
    this.auxClaveNombre = `${a.nombres} ${a.apellidos}`;
    this.nuevaClaveAux = '';
    this.mostrarClaveAux = false;
    this.errorClaveAux = null;
    this.modalClaveAux = true;
    this.cdr.markForCheck();
  }

  cerrarModalClaveAux(): void { this.modalClaveAux = false; this.cdr.markForCheck(); }

  guardarClaveAux(): void {
    if (this.nuevaClaveAux.length < 4) {
      this.errorClaveAux = 'Mínimo 4 caracteres.';
      return;
    }
    this.guardandoClaveAux = true;
    this.auxSvc.cambiarClave(this.auxClaveId!, this.nuevaClaveAux).subscribe({
      next: () => {
        this.guardandoClaveAux = false;
        this.modalClaveAux = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardandoClaveAux = false;
        this.errorClaveAux = err?.error?.mensaje ?? 'Error al cambiar clave.';
        this.cdr.markForCheck();
      },
    });
  }

  toggleEstadoAux(a: AuxiliarDetalleDto): void {
    this.auxSvc.toggleEstado(a.id).subscribe({
      next: (res) => { a.estado = res.estado; this.cdr.markForCheck(); },
    });
  }

  // ── Lógica Administrativos ──────────────────────────────────
  administrativos: AdministrativoDetalleDto[] = [];
  administrativosFiltrados: AdministrativoDetalleDto[] = [];
  loadingAdmin = false;
  errorLoadAdmin: string | null = null;
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
  mostrarClaveAdmin = false;
  errorClaveAdmin: string | null = null;
  guardandoClaveAdmin = false;

  cargarAdmin(): void {
    this.loadingAdmin = true;
    this.errorLoadAdmin = null;
    this.adminSvc.getAll().subscribe({
      next: (data) => {
        this.administrativos = data;
        this.filtrarAdmin();
        this.loadingAdmin = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingAdmin = false;
        this.errorLoadAdmin = `Error ${err?.status}: No se pudieron cargar los administrativos.`;
        this.cdr.markForCheck();
      },
    });
  }

  filtrarAdmin(): void {
    const q = this.busquedaAdmin.toLowerCase().trim();
    this.administrativosFiltrados = q
      ? this.administrativos.filter(a =>
          a.nombres.toLowerCase().includes(q) ||
          a.apellidos.toLowerCase().includes(q) ||
          a.dni.includes(q)
        )
      : [...this.administrativos];
  }

  onBusquedaAdmin(): void { this.filtrarAdmin(); }

  abrirModalCrearAdmin(): void {
    this.formCrearAdmin = { dni: '', nombres: '', apellidos: '', correoPersonal: null, telefono: null };

    this.errorCrearAdmin = null;
    this.credencialesAdmin = null;
    this.modalCrearAdmin = true;
    this.cdr.markForCheck();
  }

  cerrarModalCrearAdmin(): void {
    this.modalCrearAdmin = false;
    this.credencialesAdmin = null;
    this.cdr.markForCheck();
  }

  crearAdministrativo(): void {
    if (!this.formCrearAdmin.dni.trim() || !this.formCrearAdmin.nombres.trim() || !this.formCrearAdmin.apellidos.trim()) {
      this.errorCrearAdmin = 'DNI, nombres y apellidos son requeridos.';
      return;
    }

    this.guardandoCrearAdmin = true;
    this.errorCrearAdmin = null;

    this.adminSvc.create(this.formCrearAdmin).subscribe({
      next: (res) => {
        this.guardandoCrearAdmin = false;
        this.credencialesAdmin = { correo: res.correo, clave: res.claveGenerada };
        this.cargarAdmin();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardandoCrearAdmin = false;
        this.errorCrearAdmin = err?.error?.mensaje ?? 'Error al registrar.';
        this.cdr.markForCheck();
      },
    });
  }

  abrirModalEditarAdmin(a: AdministrativoDetalleDto): void {
    this.adminEditandoId = a.id;
    this.adminEditando = a;
    this.formEditarAdmin = { nombres: a.nombres, apellidos: a.apellidos, correoPersonal: a.correoPersonal, telefono: a.telefono };
    this.errorEditarAdmin = null;
    this.modalEditarAdmin = true;
    this.cdr.markForCheck();
  }

  cerrarModalEditarAdmin(): void { this.modalEditarAdmin = false; this.cdr.markForCheck(); }

  guardarEdicionAdmin(): void {
    if (!this.formEditarAdmin.nombres.trim() || !this.formEditarAdmin.apellidos.trim()) {
      this.errorEditarAdmin = 'Nombres y apellidos son requeridos.';
      return;
    }
    this.guardandoEditarAdmin = true;
    this.errorEditarAdmin = null;
    this.adminSvc.update(this.adminEditandoId!, this.formEditarAdmin).subscribe({
      next: () => {
        this.cargarAdmin();
        this.guardandoEditarAdmin = false;
        this.modalEditarAdmin = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardandoEditarAdmin = false;
        this.errorEditarAdmin = err?.error?.mensaje ?? 'Error al actualizar.';
        this.cdr.markForCheck();
      },
    });
  }

  abrirModalClaveAdmin(a: AdministrativoDetalleDto): void {
    this.adminClaveId = a.id;
    this.adminClaveNombre = `${a.nombres} ${a.apellidos}`;
    this.nuevaClaveAdmin = '';
    this.mostrarClaveAdmin = false;
    this.errorClaveAdmin = null;
    this.modalClaveAdmin = true;
    this.cdr.markForCheck();
  }

  cerrarModalClaveAdmin(): void { this.modalClaveAdmin = false; this.cdr.markForCheck(); }

  guardarClaveAdmin(): void {
    if (this.nuevaClaveAdmin.length < 4) {
      this.errorClaveAdmin = 'Mínimo 4 caracteres.';
      return;
    }
    this.guardandoClaveAdmin = true;
    this.adminSvc.cambiarClave(this.adminClaveId!, this.nuevaClaveAdmin).subscribe({
      next: () => {
        this.guardandoClaveAdmin = false;
        this.modalClaveAdmin = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardandoClaveAdmin = false;
        this.errorClaveAdmin = err?.error?.mensaje ?? 'Error al cambiar clave.';
        this.cdr.markForCheck();
      },
    });
  }

  toggleEstadoAdmin(a: AdministrativoDetalleDto): void {
    this.adminSvc.toggleEstado(a.id).subscribe({
      next: (res) => { a.estado = res.estado; this.cdr.markForCheck(); },
    });
  }
}
