import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstructuraService } from '../../../../../../../core/services/estructura';

interface AulaConTutor {
  id: number;
  gradoNombre: string;
  seccionLetra: string;
  tutorId: number | null;
  tutorNombre: string | null;
  estado: number;
}

interface Docente {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  estado: number;
}

@Component({
  selector: 'app-tutoria-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tutoria-manager.html',
  styleUrl: './tutoria-manager.scss'
})
export class TutoriaManagerComponent implements OnInit {
  private svc = inject(EstructuraService);
  private cdr = inject(ChangeDetectorRef);

  aulas:    AulaConTutor[] = [];
  docentes: Docente[]      = [];
  loading   = true;
  errorLoad: string | null  = null;

  selecciones: Record<number, number | null> = {};
  guardando:   Record<number, boolean>       = {};
  toast = { visible: false, mensaje: '', error: false };

  get tutoriasAsignadas(): number {
    return this.aulas.filter(a => a.tutorId !== null).length;
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading  = true;
    this.errorLoad = null;

    this.svc.getAulasDetalle().subscribe({
      next: aulas => {
        this.aulas = aulas as any[];
        this.aulas.forEach(a => (this.selecciones[a.id] = a.tutorId ?? null));
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorLoad = 'No se pudieron cargar las aulas.';
        this.cdr.markForCheck();
      }
    });

    this.svc.getDocentes().subscribe({
      next: d => {
        this.docentes = d.filter(doc => doc.estado === 1);
        this.loading  = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorLoad = 'No se pudieron cargar los docentes.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  asignarTutor(aula: AulaConTutor): void {
    const tutorId = this.selecciones[aula.id];
    if (!tutorId) return;
    this.guardando[aula.id] = true;

    this.svc.asignarTutor(aula.id, tutorId).subscribe({
      next: () => {
        const doc = this.docentes.find(d => d.id === tutorId);
        aula.tutorId     = tutorId;
        aula.tutorNombre = doc ? `${doc.apellidos}, ${doc.nombres}` : '';
        this.guardando[aula.id] = false;
        this.mostrarToast('Tutor asignado correctamente.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardando[aula.id] = false;
        this.mostrarToast(err.error?.mensaje ?? 'Error al asignar tutor.', true);
        this.cdr.markForCheck();
      }
    });
  }

  quitarTutor(aula: AulaConTutor): void {
    this.guardando[aula.id] = true;
    this.svc.asignarTutor(aula.id, null).subscribe({
      next: () => {
        aula.tutorId     = null;
        aula.tutorNombre = null;
        this.selecciones[aula.id] = null;
        this.guardando[aula.id]   = false;
        this.mostrarToast('Tutor removido correctamente.');
        this.cdr.markForCheck();
      },
      error: () => {
        this.guardando[aula.id] = false;
        this.mostrarToast('Error al quitar tutor.', true);
        this.cdr.markForCheck();
      }
    });
  }

  private mostrarToast(mensaje: string, error = false): void {
    this.toast = { visible: true, mensaje, error };
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toast.visible = false;
      this.cdr.markForCheck();
    }, 3000);
  }
}
