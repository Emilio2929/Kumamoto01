import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalificacionService, CargaDocente } from '../../../../../core/services/calificacion.service';
import { DocenteService, EstudianteSimple } from '../../../../../core/services/docente';

@Component({
  selector: 'app-incidencias-docente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidencias.html',
  styleUrl: './incidencias.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncidenciasDocenteComponent implements OnInit {
  private calificacionService = inject(CalificacionService);
  private docenteService = inject(DocenteService);
  private cdr = inject(ChangeDetectorRef);

  cursos: CargaDocente[] = [];
  selectedCargaId: number | null = null;
  estudiantes: EstudianteSimple[] = [];
  selectedEstudianteId: number | null = null;

  tipoIncidencia = '';
  descripcion = '';

  tiposDisponibles = [
    'Conducta inadecuada',
    'Tardanza recurrente',
    'Incumplimiento de tareas',
    'Falta de respeto',
    'Uso de dispositivos electrónicos no autorizados',
    'Otro'
  ];

  loadingCursos = true;
  loadingEstudiantes = false;
  guardando = false;

  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  ngOnInit(): void {
    this.cargarCursos();
  }

  cargarCursos(): void {
    this.loadingCursos = true;
    this.calificacionService.getMisCursos().subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        if (cursos.length > 0) {
          this.selectedCargaId = cursos[0].cargaId;
          this.onCargaChange();
        } else {
          this.loadingCursos = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.mensajeError = 'Error al cargar los cursos asignados.';
        this.loadingCursos = false;
        this.cdr.markForCheck();
      }
    });
  }

  onCargaChange(): void {
    if (!this.selectedCargaId) return;
    this.loadingEstudiantes = true;
    this.selectedEstudianteId = null;
    this.estudiantes = [];
    this.cdr.markForCheck();

    this.docenteService.getEstudiantesCarga(this.selectedCargaId).subscribe({
      next: (est) => {
        this.estudiantes = est;
        if (est.length > 0) {
          this.selectedEstudianteId = est[0].id;
        }
        this.loadingCursos = false;
        this.loadingEstudiantes = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.mensajeError = 'Error al cargar la lista de estudiantes.';
        this.loadingCursos = false;
        this.loadingEstudiantes = false;
        this.cdr.markForCheck();
      }
    });
  }

  get canSave(): boolean {
    return !!this.selectedEstudianteId && !!this.tipoIncidencia && !this.guardando;
  }

  guardarIncidencia(): void {
    if (!this.selectedEstudianteId || !this.tipoIncidencia) return;

    this.guardando = true;
    this.mensajeExito = null;
    this.mensajeError = null;
    this.cdr.markForCheck();

    const payload = {
      estudianteId: Number(this.selectedEstudianteId),
      tipoIncidencia: this.tipoIncidencia,
      descripcion: this.descripcion || undefined
    };

    this.docenteService.registrarIncidencia(payload).subscribe({
      next: () => {
        this.mensajeExito = 'Incidencia registrada y notificada correctamente.';
        this.tipoIncidencia = '';
        this.descripcion = '';
        this.guardando = false;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.mensajeExito = null;
          this.cdr.markForCheck();
        }, 3000);
      },
      error: () => {
        this.mensajeError = 'Error al registrar la incidencia. Verifica la conexión.';
        this.guardando = false;
        this.cdr.markForCheck();
      }
    });
  }
}
