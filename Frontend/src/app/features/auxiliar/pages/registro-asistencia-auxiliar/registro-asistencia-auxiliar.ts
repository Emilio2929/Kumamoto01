import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuxiliarService, AsistenciaAlumnoHoyDto } from '../../../../core/services/auxiliar';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IncidenciasService } from '../../../../core/services/incidencias';

type Row = {
  alumno: AsistenciaAlumnoHoyDto;
  valor: 'P' | 'F';
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

  loading = true;
  saving = false;
  errorMsg: string | null = null;
  bloqueadaPorDocente = false;
  fueraDeHorario = false;
  cursoActual: string | null = null;
  horarioClase: string | null = null;

  rows: Row[] = [];

  incidenciaForm = this.fb.group({
    estudianteId: this.fb.control<number | null>(null, Validators.required),
    tipoIncidencia: this.fb.control<string>('Conducta', Validators.required),
    descripcion: this.fb.control<string>(''),
  });

  incidenciaOpen = false;
  incidenciaSaving = false;
  incidenciaError: string | null = null;

  ngOnInit(): void {
    this.svc.getAsistenciaHoy(this.aulaId).subscribe({
      next: (res) => {
        this.bloqueadaPorDocente = res.bloqueadaPorDocente;
        this.fueraDeHorario = res.fueraDeHorario;
        this.cursoActual = res.cursoActual;
        this.horarioClase = res.horarioClase;
        this.rows = res.alumnos.map((a) => ({
          alumno: a,
          valor: (a.valor?.toUpperCase() === 'F' ? 'F' : 'P') as 'P' | 'F',
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

  toggle(row: Row) {
    row.valor = row.valor === 'P' ? 'F' : 'P';
    this.cdr.markForCheck();
  }

  guardar() {
    if (this.bloqueadaPorDocente) return;
    this.saving = true;
    this.errorMsg = null;
    const payload = {
      items: this.rows.map((r) => ({ estudianteId: r.alumno.estudianteId, valor: r.valor })),
    };
    this.svc.guardarAsistenciaAula(this.aulaId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error guardando asistencia', err);
        this.saving = false;
        this.errorMsg = err?.status === 409 ? 'La asistencia ya fue registrada por el docente.' : 'No se pudo guardar.';
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
          this.incidenciaError = 'No se pudo registrar la incidencia.';
          this.cdr.markForCheck();
        },
      });
  }

  trackByEstudianteId = (_: number, item: Row) => item.alumno.estudianteId;
}

