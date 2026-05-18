import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DocenteService, ClaseHoy, EstudianteSimple } from '../../../../../core/services/docente';
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
  clasesHoy: ClaseHoy[] = [];
  claseSeleccionada: ClaseHoy | null = null;
  estudiantes: EstudianteSimple[] = [];
  
  // key: estudianteId, value: 'P' | 'F' | 'T'
  asistenciaMarcada: { [key: number]: string } = {};
  guardando = false;

  ngOnInit() {
    this.cargarClasesHoy();
  }

  cargarClasesHoy() {
    this.loading = true;
    this.docenteService.getClasesHoy().subscribe({
      next: (res) => {
        this.clasesHoy = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarClase(clase: ClaseHoy) {
    this.claseSeleccionada = clase;
    this.loading = true;
    this.asistenciaMarcada = {};
    
    this.docenteService.getEstudiantesCarga(clase.cargaId).subscribe({
      next: (res: any[]) => {
        this.estudiantes = res;
        this.estudiantes.forEach(e => {
          this.asistenciaMarcada[e.id] = (e as any).valorActual || '';
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarEstado(estudianteId: number, valor: string) {
    this.asistenciaMarcada[estudianteId] = valor;
  }

  get canSave(): boolean {
    return this.estudiantes.length > 0 && 
           this.estudiantes.every(e => this.asistenciaMarcada[e.id] === 'P' || this.asistenciaMarcada[e.id] === 'F' || this.asistenciaMarcada[e.id] === 'T') && 
           !this.guardando;
  }

  confirmarGuardarOpen = false;

  guardarAsistencia() {
    if (!this.claseSeleccionada) return;
    this.confirmarGuardarOpen = true;
    this.cdr.detectChanges();
  }

  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  ejecutarGuardar() {
    if (!this.claseSeleccionada) return;
    this.confirmarGuardarOpen = false;
    this.guardando = true;
    this.mensajeExito = null;
    this.mensajeError = null;
    this.cdr.detectChanges();

    const data = Object.keys(this.asistenciaMarcada).map(id => ({
      estudianteId: parseInt(id),
      valor: this.asistenciaMarcada[parseInt(id)]
    }));

    this.docenteService.registrarAsistencia(this.claseSeleccionada.cargaId, data).subscribe({
      next: () => {
        this.mensajeExito = 'Asistencia guardada correctamente.';
        setTimeout(() => {
          this.claseSeleccionada = null; // Volver a la lista de clases
          this.cargarClasesHoy();
          this.mensajeExito = null;
          this.cdr.detectChanges();
        }, 2000);
        this.guardando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.mensajeError = 'Error al guardar la asistencia.';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }
}
