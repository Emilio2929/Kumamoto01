import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuxiliarService, AsistenciaAlumnoHoyDto, AulaAsignadaAuxiliarDto } from '../../../../core/services/auxiliar';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IncidenciasService } from '../../../../core/services/incidencias';

type AsistenciaValor = 'P' | 'F' | 'T';

type Row = {
  alumno: AsistenciaAlumnoHoyDto;
  valor: AsistenciaValor;
};

@Component({
  selector: 'app-registro-asistencia-auxiliar',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './registro-asistencia-auxiliar.html',
  styleUrl: './registro-asistencia-auxiliar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroAsistenciaAuxiliarComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(AuxiliarService);
  private readonly incidenciasSvc = inject(IncidenciasService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

  aulaId = Number(this.route.snapshot.paramMap.get('aulaId'));
  cargaId = Number(this.route.snapshot.paramMap.get('cargaId'));

  loading = true;
  saving = false;
  errorMsg: string | null = null;
  bloqueadaPorDocente = false;
  fueraDeHorario = false;
  cursoActual: string | null = null;
  horarioClase: string | null = null;
  hoy = new Date();
  aulas: AulaAsignadaAuxiliarDto[] = [];

  rows: Row[] = [];

  incidenciaForm = this.fb.group({
    estudianteId: this.fb.control<number | null>(null, Validators.required),
    tipoIncidencia: this.fb.control<string>('Conducta', Validators.required),
    descripcion: this.fb.control<string>(''),
  });

  incidenciaOpen = false;
  incidenciaSaving = false;
  incidenciaError: string | null = null;

  confirmarGuardarOpen = false;

  ngOnInit(): void {
    // Cargar nombres de aulas para el header
    this.svc.getMisAulas().subscribe(data => {
      this.aulas = data;
      this.cdr.markForCheck();
    });

    this.svc.getAsistenciaHoy(this.aulaId, this.cargaId).subscribe({
      next: (res) => {
        this.bloqueadaPorDocente = res.bloqueadaPorDocente;
        this.fueraDeHorario = res.fueraDeHorario;
        this.cursoActual = res.cursoActual;
        this.horarioClase = res.horarioClase;
        this.rows = res.alumnos.map((a) => ({
          alumno: a,
          valor: this.normalizarValor(a.valor),
        }));
        this.loading = false;
        this.errorMsg = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando asistencia hoy', err);
        this.loading = false;
        this.errorMsg = 'No se pudo cargar la asistencia del aula.';
        this.cdr.markForCheck();
      },
    });
  }

  private normalizarValor(v: string | null): AsistenciaValor {
    if (!v) return 'P';
    const val = v.toUpperCase();
    if (val === 'T') return 'T';
    if (val === 'F') return 'F';
    return 'P';
  }

  setValor(row: Row, valor: AsistenciaValor) {
    row.valor = valor;
    this.cdr.markForCheck();
  }

  guardar() {
    this.confirmarGuardarOpen = true;
    this.cdr.markForCheck();
  }

  ejecutarGuardar() {
    this.confirmarGuardarOpen = false;
    this.saving = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    const payload = {
      cargaId: this.cargaId,
      items: this.rows.map((r) => ({ 
        estudianteId: r.alumno.estudianteId, 
        valor: r.valor 
      })),
    };

    this.svc.guardarAsistenciaAula(this.aulaId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.cdr.markForCheck();
        // Podríamos mostrar un mensaje de éxito o navegar
      },
      error: (err) => {
        console.error('Error guardando asistencia', err);
        this.saving = false;
        this.errorMsg = 'No se pudo guardar la asistencia.';
        this.cdr.markForCheck();
      },
    });
  }

  abrirIncidencia(estudianteId: number) {
    this.incidenciaError = null;
    this.incidenciaForm.reset({
      estudianteId,
      tipoIncidencia: 'Conducta',
      descripcion: '',
    });
    this.incidenciaOpen = true;
    this.cdr.markForCheck();
  }

  cerrarIncidencia() {
    this.incidenciaOpen = false;
    this.incidenciaSaving = false;
    this.incidenciaError = null;
    this.cdr.markForCheck();
  }

  guardarIncidencia() {
    this.incidenciaForm.markAllAsTouched();
    if (this.incidenciaForm.invalid) return;

    const v = this.incidenciaForm.getRawValue();
    if (!v.estudianteId) return;

    this.incidenciaSaving = true;
    this.incidenciaError = null;
    this.cdr.markForCheck();

    this.incidenciasSvc
      .crearIncidencia({
        estudianteId: v.estudianteId,
        tipoIncidencia: v.tipoIncidencia ?? 'Conducta',
        descripcion: v.descripcion ?? '',
      })
      .subscribe({
        next: () => {
          this.incidenciaSaving = false;
          this.incidenciaOpen = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error creando incidencia', err);
          this.incidenciaSaving = false;
          this.incidenciaError = 'No se pudo registrar la incidencia en la base de datos.';
          this.cdr.markForCheck();
        },
      });
  }

  getAulaName() {
    const a = this.aulas.find(x => x.aulaId === this.aulaId);
    return a ? `${a.gradoNombre} ${a.seccionLetra}` : `ID ${this.aulaId}`;
  }

  trackByEstudianteId = (_: number, item: Row) => item.alumno.estudianteId;
}
