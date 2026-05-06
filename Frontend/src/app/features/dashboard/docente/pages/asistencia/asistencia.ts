import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DocenteService, ClaseActualResponse } from '../../../../../core/services/docente';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asistencia-docente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencia.html',
  styleUrls: ['./asistencia.scss']
})
export class AsistenciaDocenteComponent implements OnInit {
  private docenteService = inject(DocenteService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  clase: ClaseActualResponse | null = null;
  asistenciaMarcada: { [key: number]: boolean } = {};
  guardando = false;

  ngOnInit() {
    this.cargarClaseActual();
  }

  cargarClaseActual() {
    this.loading = true;
    this.docenteService.getClaseActual().subscribe({
      next: (res) => {
        this.clase = res;
        if (res.activa && res.estudiantes) {
          // Inicializar todos como presentes por defecto
          res.estudiantes.forEach(e => {
            this.asistenciaMarcada[e.id] = true;
          });
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleAsistencia(estudianteId: number) {
    this.asistenciaMarcada[estudianteId] = !this.asistenciaMarcada[estudianteId];
  }

  get canSave(): boolean {
    return Object.keys(this.asistenciaMarcada).length > 0 && !this.guardando;
  }

  guardarAsistencia() {
    if (!this.clase || !this.clase.cargaId) return;

    this.guardando = true;
    const data = Object.keys(this.asistenciaMarcada).map(id => ({
      estudianteId: parseInt(id),
      presente: this.asistenciaMarcada[parseInt(id)]
    }));

    this.docenteService.registrarAsistencia(this.clase.cargaId, data).subscribe({
      next: () => {
        alert('Asistencia guardada correctamente.');
        this.clase = null; // Limpiar para mostrar mensaje de éxito/vacío
        this.cargarClaseActual();
        this.guardando = false;
      },
      error: (err) => {
        console.error(err);
        alert('Error al guardar la asistencia.');
        this.guardando = false;
      }
    });
  }
}
